# UI Alerting — Design

**Date:** 2026-06-18
**Status:** Validated, ready for implementation plan

## Problem

Alerting (baker groups, per-group `missed_threshold`, channels) was shipped at the
**backend + TOML** level only (`[[baker_group]]`, Discord/Telegram/Slack/email senders,
`@group:NAME` routing). None of it is visible or configurable from the UI. The UI only
exposes `bakerMonitorSettings` (rpc, headDistance, global missedThreshold).

This adds a **hybrid** alerting surface to the UI: edit the "safe" things (per-group
thresholds, manual group membership), view per-group alert state. Secrets
(webhooks/tokens) and channel/group creation stay in the TOML.

## Scope decisions

- **Hybrid (C):** edit safe settings in the UI, secrets stay in TOML.
- **Edit (B):** per-group `missed_threshold` + manual membership for `static` groups.
  `stake` groups (whales) → threshold editable, membership read-only.
- **View (A):** per-group dashboard — threshold, member count, how many at-risk.
- **Placement (A):** new "Alerting" section at the top of the bakers view.

Guiding principle: **easy to use, easy to maintain** — reuse existing patterns
(overrides overlay, admin-token mutations, Chakra cards, Apollo polling). No routing,
no new persistence mechanism, no channel/secret editing.

## Section 1 — Data model & persistence (backend)

Reuse the existing `overrides.json` overlay; never write to the TOML.

Extend `ConfigManager` (already handles `baker_monitor` + `alias`) with a `baker_group`
key:

```jsonc
// overrides.json
{
  "baker_group": {
    "whales": { "missed_threshold": 75 },
    "corpo":  { "missed_threshold": 50, "bakers": ["tz1...", "tz1..."] }
  }
}
```

- Baseline = TOML (via `BakerGroupsRegistry`), overlay = overrides.json. Overlay wins,
  same as bakers/alias.
- New `ConfigManager` methods: `setGroupThreshold(name, n)`,
  `addBakerToGroup(name, addr)`, `removeBakerFromGroup(name, addr)` →
  `persist()` + `emit("groups-changed")`.

Adapt `BakerGroupsRegistry`: today `missed_threshold` and `maxThreshold` are immutable
after `create()`. Add `setGroupThreshold(name, n)` that mutates the threshold,
**recomputes `maxThreshold`**, and invalidates `thresholdCache`. Membership edits go
through the existing `setGroupBakers`.

Wiring: at startup `ConfigManager` applies `baker_group` overrides onto the registry; on
each UI mutation the `groups-changed` event re-pushes to the registry → the monitor
picks up the new threshold live (same mechanism as the current `settings-changed`).

Guards:
- `kind: "stake"` (whales) → threshold editable, membership read-only (avoids collision
  with `whalesRefresh` which periodically rewrites the list).
- `kind: "static"` → threshold + membership editable.

## Section 2 — GraphQL surface

All mutations protected by the admin token, like existing baker mutations.

```graphql
type BakerGroup {
  name: String!
  kind: String!            # "static" | "stake"
  missedThreshold: Int!
  bakers: [String!]!       # resolved members (baseline+overlay, or live list for stake)
  atRiskCount: Int!        # members currently in missed-alert state
}

extend type Query {
  bakerGroups: [BakerGroup!]!
}

extend type Mutation {
  setGroupThreshold(name: String!, missedThreshold: Int!): MutationResult!
  addBakerToGroup(name: String!, address: String!): MutationResult!     # static only
  removeBakerFromGroup(name: String!, address: String!): MutationResult! # static only
}
```

- `atRiskCount` = members whose current missed state exceeds the group threshold (the
  same signal that drives `BakerMissedAtRisk` / `BakerRecovered`). Computed in the
  resolver by crossing group members with `bakerMonitor` state — no new tracking.
- `addBakerToGroup` / `removeBakerFromGroup` return an explicit error for `stake` groups.
- `setGroupThreshold` validates `n >= 1`.
- Reuse the existing `MutationResult` type.
- Regenerate Apollo types with `yarn generate:gql` (codegen), as elsewhere.

## Section 3 — UI: "Alerting" section

New `Alerting.tsx` mounted at the top of `App.tsx`, above the baker list. Chakra cards,
consistent with existing style. One card per group:

```
┌─ whales  [auto]──────────────────────┐
│  Threshold: [ 75 ] blocks (~10 min) ✏ │
│  ⚠ 2 / 18 bakers at risk             │
└──────────────────────────────────────┘
┌─ corpo  [manual]─────────────────────┐
│  Threshold: [ 50 ] blocks (~7 min)  ✏ │
│  ✓ 0 / 25 bakers at risk             │
│  [ + add a baker to the group ]       │
└──────────────────────────────────────┘
```

- Threshold: inline Chakra `NumberInput` → `setGroupThreshold` on blur/Enter, with a
  minutes conversion (`threshold × ~6-8s`) next to it.
- Badge `auto` (stake) / `manual` (static).
- At-risk: `atRiskCount / bakers.length`, red if > 0 else green.
- Membership (manual groups only): "+ add" button, each member listed with a remove
  cross. Auto groups don't show these controls.
- Admin lock: edit controls only appear when unlocked (reuse `AuthContext` + the
  existing "Unlock" pattern).
- Refresh via the existing Apollo polling (`use-interval`).

## Section 4 — Edge cases & tests

Edge cases:
- **No groups configured** (current corpo TOML): show a single read-only "Global" card
  with the editable global `missed_threshold` (already wired via `updateSettings`). No
  empty/odd state.
- **whalesRefresh vs overlay**: stake refresh writes membership in memory (not
  persisted); the overlay only touches the threshold for `stake` groups. No collision.
- **Baker removed from monitoring** but still listed in a group → filtered at display,
  no error.
- **Invalid threshold** (`< 1`) → rejected in the resolver, Chakra error toast.
- **Override for a group no longer in the TOML** → ignored (we don't resurrect a group
  absent from the baseline), logged as a warning. Group creation stays TOML-only.

Tests:
- `configManager.test.ts`: `baker_group` overrides (set threshold, add/remove
  membership, tombstone, persist/reload).
- `bakerGroups.test.ts`: `setGroupThreshold` recomputes `maxThreshold` + invalidates the
  cache.
- Resolver: `setGroupThreshold` rejects `< 1`; `addBakerToGroup` rejects a `stake` group.
- Front: no heavy unit tests (consistent with existing); manual validation via the local
  instance tunneled to the VPS node.
