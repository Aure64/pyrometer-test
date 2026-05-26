# Baker groups & Discord sender — design

**Status:** Draft, awaiting user review
**Author:** Aurelien
**Date:** 2026-05-26

## Motivation

Pyrometer currently fires `BakerUnhealthy` / `BakerRecovered` events based on a single global `missed_threshold` shared by all monitored bakers. The operational need (Nomadic Labs / VPS `baker-test-ovh`) is to monitor a large set of mainnet bakers with **different urgency tiers** — large bakers (>1M tez) should trigger alerts within ~10 minutes of misbehavior, while smaller bakers can tolerate longer windows before firing.

A secondary need is a dedicated Discord sender for routing whale alerts to a Discord channel, complementing the existing Slack/Telegram/Email/Desktop/Webhook senders.

These two needs are tightly related: per-tier thresholds are useless without per-tier routing.

## Goals

- Allow declaring named groups of bakers in TOML, each with its own `missed_threshold`.
- Support both **static** groups (explicit list of `tz...` addresses) and **dynamic** groups (membership computed from on-chain staking balance, refreshed periodically).
- Provide a syntax for senders to reference a group's baker list (`bakers = ["@group:whales"]`) so the same list serves both threshold lookup and notification routing without duplication.
- Add a dedicated Discord sender with rich embeds (color-coded severity, alias resolution, tzkt links).
- Preserve full backward compatibility: configs without `[[baker_group]]` behave identically to today.

## Non-goals

- Routing by event severity (e.g., alert Slack at threshold/2 and Discord at full threshold).
- Silences / mute windows.
- UI for editing groups (read-only exposure via GraphQL is in scope for v1; editing is deferred).
- One Discord webhook per group (covered today by running multiple Pyrometer instances if absolutely needed).

## TOML schema

```toml
[baker_monitor]
bakers = ["tz1...", "tz1..."]      # ungrouped bakers; use global missed_threshold
missed_threshold = 5                # existing default; becomes the fallback
rpc = "http://127.0.0.1:8732"

# Static group: explicit list
[[baker_group]]
name = "corporate"
bakers = ["tz1XJqNybPz88X84kGPLN5LFaC4oN1av75dA", "tz1gcna2..."]
missed_threshold = 30               # ~5 min on Tallinn

# Dynamic group: stake-based, refreshed every 3 cycles (~72h)
[[baker_group]]
name = "whales"
stake_min = 1_000_000_000_000      # 1M tez expressed in mutez
missed_threshold = 75               # ~10 min

[discord]
enabled = true
url = "https://discord.com/api/webhooks/..."
emoji = true
short_address = true
exclude = ["baked", "endorsed"]
bakers = ["@group:whales"]          # only whale events

[slack]
enabled = true
url = "https://hooks.slack.com/..."
bakers = ["@group:whales", "@group:corporate"]
```

### Validation rules

All failures cause `process.exit(1)` at boot with an explicit message. No silent warnings.

| Condition | Error message template |
|---|---|
| `name` missing or duplicated | `baker_group #N: 'name' is required` / `duplicate name "X"` |
| Neither `bakers` nor `stake_min` set | `baker_group "X": must define either 'bakers' or 'stake_min'` |
| Both `bakers` and `stake_min` set | `baker_group "X": 'bakers' and 'stake_min' are mutually exclusive` |
| `missed_threshold` missing or ≤ 0 | `baker_group "X": 'missed_threshold' must be > 0` |
| Invalid `tz...` address in `bakers` | `baker_group "X": invalid address tz...` |
| `stake_min ≤ 0` | `baker_group "X": 'stake_min' must be > 0` |
| `@group:Y` references unknown group | `<sender>.bakers: unknown group "Y"` |
| `name` not matching `[a-z][a-z0-9_-]*` | `baker_group "X": name must match [a-z][a-z0-9_-]*` |

### Semantics

- **Overlap (baker in multiple groups):** allowed. The **lowest** `missed_threshold` among matching groups applies (most aggressive). Rationale: a corporate whale should get the faster alert.
- **Ungrouped bakers:** fall back to `[baker_monitor] missed_threshold`. Existing configs are untouched.
- **Monitored set:** union of `[baker_monitor] bakers` and all `[[baker_group]]` bakers (static + dynamic). No need to duplicate addresses across sections.
- **`@group:X` resolution:** **dynamic** — senders hold a callback that returns the current group membership at each batch. Stake-based groups stay live without restart.

## Architecture

### Modules

```
backend/src/
├── config.ts               [+]   schema, validation, @group: resolution
├── bakerMonitor.ts         [+]   per-baker threshold lookup (function, not scalar)
├── events.ts               [+]   FilteredSender accepts () => string[] for bakers
├── bakerGroups.ts          [NEW] runtime registry; threshold lookup; group resolution
├── whalesRefresh.ts        [NEW] periodic stake-based group refresh service
├── senders/
│   ├── discord.ts          [NEW] dedicated Discord webhook sender with embeds
│   ├── slack.ts            [+]   bakers can be string[] or () => string[]
│   ├── telegram.ts         [+]   same
│   ├── email.ts            [+]   same
│   └── desktop.ts          [+]   same
├── run.ts                  [+]   wire registry, refresh service, Discord channel
├── rpc/client.ts           [+]   getStakingBalance(pkh)
└── api/                    [+]   expose groups in GraphQL (read-only, v1)
```

### `bakerGroups.ts` (new, simplified — no notifyChange)

Central in-memory registry. Three consumers (bakerMonitor, senders, monitored-set computation) hit a single source of truth.

```ts
export type BakerGroup = {
  name: string;
  missed_threshold: number;
  kind: "static" | "stake";
  stake_min?: bigint;
  bakers: Set<string>;          // mutable for stake-based refresh
};

export type BakerGroupsRegistry = {
  getGroup: (name: string) => BakerGroup | undefined;
  getThresholdFor: (baker: string) => number;        // lowest matching, else fallback
  getAllMonitoredBakers: () => string[];             // union with static baker_monitor.bakers
  setGroupBakers: (name: string, addrs: string[]) => void;  // called by whalesRefresh
};
```

Lookups are direct (Map iteration over typically <5 groups, fast enough; no caching layer in v1).

### `bakerMonitor.ts` — threshold becomes a callback

Today `checkHealth` (lines 604–630) takes `missedEventsThreshold: number`. Replace with `getThreshold: (baker: TzAddress) => number`. Call site (line 405) passes `bakerGroups.getThresholdFor`.

`BakerMonitorConfig.missed_threshold` is retained — it is the fallback used by the registry. New parameter on `create()`: `bakerGroups: BakerGroupsRegistry`.

`MAX_HISTORY = Math.max(7, ...allThresholds)` where `allThresholds` is the set of every group's `missed_threshold` plus the fallback. Computed once at boot. Avoids truncating history for groups with high thresholds.

### `events.ts` — `FilteredSender` accepts a callback

```ts
export const FilteredSender = (
  sender: Sender,
  config: { exclude: Events[]; bakers: string[] | (() => string[]) | undefined },
): Sender => { ... };
```

At each batch, if `bakers` is a function it is invoked. `config.ts` produces the callback when a sender's `bakers` array contains any `@group:X` reference; otherwise `bakers` remains a `string[]` (no breaking change for existing configs).

### `senders/discord.ts` — Discord webhook with embeds

```ts
export type DiscordConfig = {
  enabled: boolean;
  url: string;
  emoji: boolean;
  short_address: boolean;
  alias: TzAddressAliasMap;
  exclude: Events[];
  bakers: string[] | (() => string[]) | undefined;
  username?: string;
};
```

One embed per event. Color by severity (red: Unhealthy, green: Recovered, orange: Missed*, gray: info). Chunk to 10 embeds per HTTP POST (Discord limit). Respect `Retry-After` on HTTP 429. No new npm dependency required — Discord webhooks accept plain `fetch` JSON POSTs.

### `whalesRefresh.ts` — periodic stake-based refresh

Service that runs every 3 cycles (~72h on Tallinn). The interval and concurrency are constructor parameters so tests can inject shorter values. For each `kind === "stake"` group:

1. `rpc.getActiveBakers("head")` → list of active delegate addresses.
2. For each, call `rpc.getStakingBalance(pkh)` with a concurrency cap of 10.
3. Filter where `staking_balance >= stake_min`.
4. `registry.setGroupBakers(name, filtered)`.
5. Persist `{ "<groupName>": { addresses, refreshedAt } }` to `{data_dir}/whales-cache.json`.

If `getActiveBakers` fails: keep previous list, log `warn`, retry next tick.
If ≥50% of `getStakingBalance` calls fail: abort this refresh, keep previous list. Avoids accidentally emptying the group on partial RPC failure.
If <50% fail: log per-baker `warn`, exclude the failed bakers from this iteration, accept the result.

### Boot flow

1. `config.load()` parses TOML and validates.
2. `bakerGroups.create(raw, fallbackThreshold, staticBakers)` instantiates the registry. Static groups populate immediately. Stake-based groups initialize with the on-disk cache if present, else empty.
3. Each sender's `bakers` containing `@group:` is wrapped into a callback against the registry.
4. `bakerMonitor.create(..., bakerGroups, ...)` starts.
5. `whalesRefresh.create(bakerGroups, rpc, refreshInterval)` starts. The first refresh is **asynchronous** — Pyrometer starts even if the RPC is unreachable; stake-based groups remain empty until a refresh succeeds (logged `warn` every ~5 min until success).
6. Discord channel is started if `[discord] enabled = true`.

### Refresh tick

```
whalesRefresh tick
  └─→ rpc.getActiveBakers
  └─→ rpc.getStakingBalance × N (concurrency 10)
  └─→ filter ≥ stake_min
  └─→ registry.setGroupBakers(name, addrs)
  └─→ persist whales-cache.json
```

Next monitor block reads the new `getThresholdFor`. Next sender batch reads the new `getBakers()`. No invalidation or notification needed.

## Error handling

### Config load
All validation rules above produce `process.exit(1)` with the listed messages. Loading is fail-fast.

### Runtime: whales refresh

| Scenario | Behavior |
|---|---|
| RPC down at first refresh, no disk cache | Pyrometer starts; stake-based groups stay empty; `warn` every ~5 min until success. |
| RPC down at a later refresh | Keep previous list; `warn`; retry next tick. |
| Disk cache missing/corrupt | Ignore it; run a fresh refresh. |
| Cycle not yet reached at boot | Load disk cache if present (even if stale); else trigger immediate refresh. |
| `getStakingBalance` fails for <50% of delegates | Log; exclude those; accept result. |
| `getStakingBalance` fails for ≥50% | Abort refresh; keep previous list. |

### Runtime: bakerMonitor
No change to existing RPC retry / backoff logic. `getThresholdFor` on a baker absent from all groups returns the fallback — identical to today's behavior, no regression.

### Runtime: Discord sender

| Scenario | Behavior |
|---|---|
| HTTP 4xx (invalid/revoked URL) | Channel `failCount++`, exponential backoff (existing `channel.ts:32` logic). No crash. |
| Payload exceeds Discord limit | Chunk to ≤10 embeds per POST. |
| HTTP 429 rate-limit | Respect `Retry-After` header; backoff beyond the channel's generic backoff. |

## Testing strategy

### Unit tests (Jest, already in place)

| File | Coverage |
|---|---|
| `bakerGroups.test.ts` [NEW] | `getThresholdFor`: baker in 1 group; baker in 2 groups (lowest wins); baker in none (fallback); `setGroupBakers` updates lookup; `getAllMonitoredBakers` union without duplicates. |
| `bakerMonitor.test.ts` [+] | Existing tests pass with `getThreshold: () => 5` (regression). New: two bakers with different thresholds receive `BakerUnhealthy` at different counts. |
| `config.test.ts` / `configManager.test.ts` [+] | All validation errors above; parse valid TOML with two groups; resolve `@group:X` in `[slack] bakers`. |
| `whalesRefresh.test.ts` [NEW] | RPC OK → group updated; RPC down → registry unchanged, retry next tick; ≥50% `getStakingBalance` failures → refresh aborted; disk cache loaded at boot. |
| `senders/discord.test.ts` [NEW] | Embed format (color per severity); chunking >10 embeds; HTTP 429 respected; `@group:X` callback filtering. |
| `events.test.ts` [+] | `FilteredSender` accepts both `string[]` and `() => string[]`; callback invoked per batch. |

### Manual integration

1. Run Pyrometer with 2 groups (1 static, 1 `stake_min`) + Discord + Slack on test channels.
2. Verify logs: refresh OK, threshold lookups correct.
3. Stub a baker as repeatedly missing endorsements; observe `BakerUnhealthy` at the right count on the right channel.
4. Cut the RPC for one cycle; verify monitoring continues, warnings logged.
5. Cut Discord (bogus URL); verify backoff and that other channels keep working.

### Regression baseline

A TOML config **without** `[[baker_group]]` (= today's prod configs) must produce **identical behavior** to the pre-change codebase. Explicit test: load `pyrometer-corpo.toml` unchanged; verify every parsed section matches and `getThresholdFor(<any baker>) === 5`.

## Rollout

| Phase | Content |
|---|---|
| 1. Foundation | `bakerGroups.ts` + tests; `FilteredSender` callback support + tests. |
| 2. Threshold per-baker | `bakerMonitor.ts` accepts `getThreshold` callback; existing tests pass. |
| 3. Config schema | TOML parsing for `[[baker_group]]`; validation; `@group:X` resolution. |
| 4. Whales refresh | `whalesRefresh.ts` + disk cache + `rpc.getStakingBalance`. |
| 5. Discord sender | `senders/discord.ts` + tests. |
| 6. Wiring | `run.ts` instantiates registry, refresh, Discord channel. |
| 7. Deployment | Update `pyrometer-global.toml` on the VPS; restart service. |

Phases 1–6 ship as one or two PRs depending on review feedback. Phase 7 is operational (no code).

## Migration

**None required.** Existing configs (`pyrometer-corpo.toml`, `pyrometer-global.toml` on the VPS) remain valid and unchanged. Activation of whales alerting is an opt-in edit of `pyrometer-global.toml` followed by `systemctl restart pyrometer-global`.

## Estimation

~3 days dev solo, +1 day buffer for review and polish. Phases 1–3 (~1 day), 4 (~1 day), 5–6 (~½ day), 7 (~½ day).

## Open items (deferred)

- GraphQL exposure of groups in `api/` — listed as in scope above but worth confirming during implementation whether it ships in v1 or right after.
- Memory footprint with high `MAX_HISTORY` thresholds (e.g., `mid` group at 300): ~1–2 MB extra in-memory eventlog. Acceptable; flagged for awareness.
