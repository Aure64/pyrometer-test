# Baker Groups & Discord Sender — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add named groups of bakers in TOML, each with its own `missed_threshold` (static list or stake-based via RPC refresh), let senders reference groups via `@group:X`, and ship a dedicated Discord sender — without breaking any existing config.

**Architecture:** A central `BakerGroupsRegistry` is the single source of truth for group membership and per-baker threshold lookup. `bakerMonitor.checkHealth` swaps its scalar threshold for a callback. `FilteredSender` accepts a callback for `bakers` so stake-based groups remain live. `whalesRefresh` periodically refreshes stake-based groups via existing RPC plumbing.

**Tech Stack:** TypeScript 5, Node, Jest, ts-jest, ESLint, Prettier, nconf + @iarna/toml for config, lodash (already present).

**Spec:** [`docs/superpowers/specs/2026-05-26-baker-groups-design.md`](../specs/2026-05-26-baker-groups-design.md)

**Repo conventions (apply everywhere):**
- Working dir for all commands: `/home/aurelien/pyrometer/backend`
- Commits in **English**, conventional commits, **no Co-Authored-By Claude**
- `backend/dist/` is tracked (used by the .deb). After modifying `backend/src/`, run `yarn build` and stage `backend/dist/` in the same commit as the source change.
- Run tests with `yarn test`; a single file: `yarn test src/path/file.test.ts`; a single case: `yarn test src/path/file.test.ts -t "name fragment"`
- Run lint with `yarn lint`; format with `yarn prettier --write src/...`

---

## File Structure

```
backend/src/
├── events.ts                     [MODIFY] FilteredSender accepts () => string[] for bakers
├── events.test.ts                [MODIFY] add callback-form test
├── bakerGroups.ts                [NEW]    central registry; threshold lookup
├── bakerGroups.test.ts           [NEW]
├── bakerMonitor.ts               [MODIFY] checkHealth(events, getThreshold, counts); create() takes registry
├── bakerMonitor.test.ts          [MODIFY] adapt existing checkHealth tests; add per-baker tests
├── config.ts                     [MODIFY] parse [[baker_group]], validate, resolve @group:
├── config.test.ts                [NEW]    validation cases (uses load() with fixture files)
├── rpc/client.ts                 [MODIFY] add getStakingBalance(pkh, block?)
├── whalesRefresh.ts              [NEW]    service that refreshes stake-based groups
├── whalesRefresh.test.ts         [NEW]
├── senders/discord.ts            [NEW]    Discord webhook sender with embeds
├── senders/discord.test.ts       [NEW]
├── senders/slack.ts              [MODIFY] type widening on SlackConfig.bakers
├── senders/telegram.ts           [MODIFY] type widening
├── senders/email.ts              [MODIFY] type widening
├── senders/desktop.ts            [MODIFY] type widening
└── run.ts                        [MODIFY] instantiate registry, refresh, discord channel
```

Test fixtures go under `backend/src/testFixtures/baker-groups/` (the folder already exists per the repo tree).

---

## Task 1: FilteredSender accepts a bakers callback

**Files:**
- Modify: `backend/src/events.ts:131-156`
- Modify: `backend/src/events.test.ts` (append a new `describe`)

- [ ] **Step 1: Read the current `FilteredSender` and `excludeEvents`**

Run: `sed -n '125,160p' backend/src/events.ts`
Note the existing shape: `bakers: string[] | undefined`.

- [ ] **Step 2: Write a failing test for the callback form**

Append to `backend/src/events.test.ts` (after the existing `describe("filtered sender", ...)` block):

```ts
describe("filtered sender with bakers callback", () => {
  const baked = (baker: string): Baked => ({
    kind: Events.Baked,
    createdAt: new Date(),
    baker,
    cycle: 1,
    level: 1,
    priority: 0,
    timestamp: new Date(),
  });

  it("invokes the bakers callback per batch and filters dynamically", async () => {
    let allow = new Set(["tz1A"]);
    const seen: Event[][] = [];
    const inner: Sender = async (events) => {
      seen.push(events);
    };
    const sender = FilteredSender(inner, {
      exclude: [],
      bakers: () => [...allow],
    });

    await sender([baked("tz1A"), baked("tz1B")]);
    expect(seen[0].map((e) => (e as Baked).baker)).toEqual(["tz1A"]);

    allow = new Set(["tz1B"]);
    await sender([baked("tz1A"), baked("tz1B")]);
    expect(seen[1].map((e) => (e as Baked).baker)).toEqual(["tz1B"]);
  });

  it("still accepts a static string[] for backward compat", async () => {
    const seen: Event[][] = [];
    const inner: Sender = async (events) => {
      seen.push(events);
    };
    const sender = FilteredSender(inner, {
      exclude: [],
      bakers: ["tz1A"],
    });
    await sender([baked("tz1A"), baked("tz1B")]);
    expect(seen[0].map((e) => (e as Baked).baker)).toEqual(["tz1A"]);
  });
});
```

You may also need to add `Sender` to the existing import at the top of the file if not already imported:

```ts
import {
  Events,
  Event,
  Notification,
  Baked,
  NodeSynced,
  FilteredSender,
  MissedEndorsement,
  Sender,
} from "./events";
```

- [ ] **Step 3: Run the test and confirm failure**

Run: `yarn test src/events.test.ts -t "bakers callback"`
Expected: FAIL. The dynamic test will fail because today the second call sees `tz1A` filtered (current behavior is `bakers` frozen as `string[]`).

- [ ] **Step 4: Update `excludeEvents` and `FilteredSender` signatures**

Edit `backend/src/events.ts` lines 131-156:

```ts
export const excludeEvents = (
  inEvents: Event[],
  exclude: Events[],
  bakers: string[] | undefined,
) => {
  return inEvents.filter(
    (e) =>
      !exclude.includes(e.kind) &&
      (!bakers || !("baker" in e) || bakers.includes(e.baker)),
  );
};

export type BakersFilter = string[] | (() => string[]) | undefined;

export const FilteredSender = (
  sender: Sender,
  config: { exclude: Events[]; bakers: BakersFilter },
): Sender => {
  return async (inEvents: Event[]) => {
    const bakersList =
      typeof config.bakers === "function" ? config.bakers() : config.bakers;
    const events = excludeEvents(inEvents, config.exclude, bakersList);
    if (events.length !== inEvents.length) {
      getLogger("events").debug(
        `Filtered out ${inEvents.length - events.length}`,
      );
    }
    await sender(events);
  };
};
```

- [ ] **Step 5: Run both new tests and confirm pass**

Run: `yarn test src/events.test.ts`
Expected: all tests PASS.

- [ ] **Step 6: Build, lint, commit**

```bash
yarn build
yarn lint src/events.ts src/events.test.ts
git add backend/src/events.ts backend/src/events.test.ts backend/dist
git commit -m "feat(events): FilteredSender accepts bakers callback for dynamic groups"
```

---

## Task 2: BakerGroupsRegistry module

**Files:**
- Create: `backend/src/bakerGroups.ts`
- Create: `backend/src/bakerGroups.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `backend/src/bakerGroups.test.ts`:

```ts
import { setLevel } from "loglevel";
import { create, RawBakerGroupConfig } from "./bakerGroups";

setLevel("SILENT");

describe("bakerGroups registry", () => {
  const A = "tz1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const B = "tz1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
  const C = "tz1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

  it("returns the fallback threshold for a baker in no group", () => {
    const reg = create([], 5, []);
    expect(reg.getThresholdFor(A)).toEqual(5);
  });

  it("returns the group threshold for a baker in one static group", () => {
    const raw: RawBakerGroupConfig[] = [
      { name: "whales", bakers: [A, B], missed_threshold: 75 },
    ];
    const reg = create(raw, 5, []);
    expect(reg.getThresholdFor(A)).toEqual(75);
    expect(reg.getThresholdFor(B)).toEqual(75);
    expect(reg.getThresholdFor(C)).toEqual(5);
  });

  it("picks the lowest threshold when a baker is in multiple groups", () => {
    const raw: RawBakerGroupConfig[] = [
      { name: "corporate", bakers: [A], missed_threshold: 30 },
      { name: "whales", bakers: [A], missed_threshold: 75 },
    ];
    const reg = create(raw, 5, []);
    expect(reg.getThresholdFor(A)).toEqual(30);
  });

  it("getAllMonitoredBakers returns the union without duplicates", () => {
    const raw: RawBakerGroupConfig[] = [
      { name: "g1", bakers: [A, B], missed_threshold: 10 },
      { name: "g2", bakers: [B, C], missed_threshold: 20 },
    ];
    const reg = create(raw, 5, [A]);
    expect(new Set(reg.getAllMonitoredBakers())).toEqual(new Set([A, B, C]));
  });

  it("stake-based groups are empty until setGroupBakers is called", () => {
    const raw: RawBakerGroupConfig[] = [
      { name: "whales", stake_min: "1000000000000", missed_threshold: 75 },
    ];
    const reg = create(raw, 5, []);
    expect(reg.getThresholdFor(A)).toEqual(5);
    expect(reg.getAllMonitoredBakers()).toEqual([]);
  });

  it("setGroupBakers updates lookups dynamically", () => {
    const raw: RawBakerGroupConfig[] = [
      { name: "whales", stake_min: "1000000000000", missed_threshold: 75 },
    ];
    const reg = create(raw, 5, []);
    reg.setGroupBakers("whales", [A, B]);
    expect(reg.getThresholdFor(A)).toEqual(75);
    expect(reg.getAllMonitoredBakers().sort()).toEqual([A, B].sort());
    reg.setGroupBakers("whales", [C]);
    expect(reg.getThresholdFor(A)).toEqual(5);
    expect(reg.getThresholdFor(C)).toEqual(75);
  });

  it("getMaxThreshold returns the maximum threshold including fallback", () => {
    const raw: RawBakerGroupConfig[] = [
      { name: "fast", bakers: [A], missed_threshold: 30 },
      { name: "slow", bakers: [B], missed_threshold: 300 },
    ];
    const reg = create(raw, 5, []);
    expect(reg.getMaxThreshold()).toEqual(300);
  });

  it("getGroup returns the group by name or undefined", () => {
    const raw: RawBakerGroupConfig[] = [
      { name: "whales", bakers: [A], missed_threshold: 75 },
    ];
    const reg = create(raw, 5, []);
    expect(reg.getGroup("whales")?.missed_threshold).toEqual(75);
    expect(reg.getGroup("nope")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `yarn test src/bakerGroups.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement `bakerGroups.ts`**

Create `backend/src/bakerGroups.ts`:

```ts
export type RawBakerGroupConfig = {
  name: string;
  missed_threshold: number;
  // exactly one of:
  bakers?: string[];
  stake_min?: string | bigint;
};

export type BakerGroup = {
  name: string;
  missed_threshold: number;
  kind: "static" | "stake";
  stake_min?: bigint;
  bakers: Set<string>;
};

export type BakerGroupsRegistry = {
  getGroup: (name: string) => BakerGroup | undefined;
  getThresholdFor: (baker: string) => number;
  getAllMonitoredBakers: () => string[];
  setGroupBakers: (name: string, addrs: string[]) => void;
  getMaxThreshold: () => number;
  listGroups: () => BakerGroup[];
};

export const create = (
  raw: RawBakerGroupConfig[],
  fallbackThreshold: number,
  staticBakers: string[],
): BakerGroupsRegistry => {
  const groups = new Map<string, BakerGroup>();

  for (const g of raw) {
    const kind: "static" | "stake" =
      g.stake_min !== undefined ? "stake" : "static";
    groups.set(g.name, {
      name: g.name,
      missed_threshold: g.missed_threshold,
      kind,
      stake_min: g.stake_min !== undefined ? BigInt(g.stake_min) : undefined,
      bakers: new Set(kind === "static" ? g.bakers ?? [] : []),
    });
  }

  const getThresholdFor = (baker: string): number => {
    let best: number | null = null;
    for (const g of groups.values()) {
      if (g.bakers.has(baker)) {
        if (best === null || g.missed_threshold < best) {
          best = g.missed_threshold;
        }
      }
    }
    return best ?? fallbackThreshold;
  };

  const getAllMonitoredBakers = (): string[] => {
    const set = new Set<string>(staticBakers);
    for (const g of groups.values()) {
      g.bakers.forEach((b) => set.add(b));
    }
    return [...set];
  };

  const setGroupBakers = (name: string, addrs: string[]): void => {
    const g = groups.get(name);
    if (!g) return;
    g.bakers = new Set(addrs);
  };

  const getMaxThreshold = (): number => {
    let max = fallbackThreshold;
    for (const g of groups.values()) {
      if (g.missed_threshold > max) max = g.missed_threshold;
    }
    return max;
  };

  return {
    getGroup: (name) => groups.get(name),
    getThresholdFor,
    getAllMonitoredBakers,
    setGroupBakers,
    getMaxThreshold,
    listGroups: () => [...groups.values()],
  };
};
```

- [ ] **Step 4: Run the tests and confirm pass**

Run: `yarn test src/bakerGroups.test.ts`
Expected: 8 tests PASS.

- [ ] **Step 5: Build, lint, commit**

```bash
yarn build
yarn lint src/bakerGroups.ts src/bakerGroups.test.ts
git add backend/src/bakerGroups.ts backend/src/bakerGroups.test.ts backend/dist
git commit -m "feat(bakerGroups): add registry with per-baker threshold lookup"
```

---

## Task 3: Adapt `checkHealth` to a getThreshold callback

**Files:**
- Modify: `backend/src/bakerMonitor.ts:598-630`
- Modify: `backend/src/bakerMonitor.test.ts:89+` (existing `checkHealth` describe block)

- [ ] **Step 1: Read the current `checkHealth` signature and its tests**

Run: `sed -n '598,630p' backend/src/bakerMonitor.ts`
Run: `sed -n '89,200p' backend/src/bakerMonitor.test.ts`

- [ ] **Step 2: Update the existing test calls to pass a function**

Edit `backend/src/bakerMonitor.test.ts`. Replace every `checkHealth([...], missedEventsThreshold, missedCounts)` call inside the `describe("checkHealth", ...)` block with `checkHealth([...], () => missedEventsThreshold, missedCounts)`.

Concretely, replace the three call sites at lines 117, 142, 163. After the change each looks like:

```ts
const health = Array.from(
  checkHealth(
    [mkEvent(kind, baker1)],
    () => missedEventsThreshold,
    missedCounts,
  ),
);
```

- [ ] **Step 3: Add a new test for per-baker thresholds**

Append inside the `describe("checkHealth", ...)` block, before the final `});`:

```ts
it("uses a per-baker threshold", async () => {
  const baker2 = "tz1BBBBBBBBBBB";
  const thresholds: Record<string, number> = {
    [baker1]: 2,
    [baker2]: 5,
  };
  const getT = (b: string) => thresholds[b] ?? 999;

  // baker1: count 1 -> 2 should fire BakerUnhealthy at 2
  const missed = new Map<string, number>([
    [baker1, 1],
    [baker2, 1],
  ]);
  const out = Array.from(
    checkHealth(
      [mkEvent(Events.MissedEndorsement, baker1), mkEvent(Events.MissedEndorsement, baker2)],
      getT,
      missed,
    ),
  );
  // baker1 reaches its threshold (2); baker2 only reaches 2 of 5
  const b1 = out.find((x) => x.baker === baker1)!;
  const b2 = out.find((x) => x.baker === baker2)!;
  expect(b1.event).toEqual(Events.BakerUnhealthy);
  expect(b1.newCount).toEqual(2);
  expect(b2.event).toEqual(undefined);
  expect(b2.newCount).toEqual(2);
});
```

- [ ] **Step 4: Run the tests and confirm 3 existing tests still fail with the old signature, plus the new one fails**

Run: `yarn test src/bakerMonitor.test.ts -t "checkHealth"`
Expected: FAIL — tests pass a function where a number is expected.

- [ ] **Step 5: Update `checkHealth` in `bakerMonitor.ts`**

Edit `backend/src/bakerMonitor.ts` lines 598-630:

```ts
export type CheckHealthResult = {
  event: Events.BakerUnhealthy | Events.BakerRecovered | undefined;
  baker: TzAddress;
  newCount: number;
};

export function* checkHealth(
  events: BakerEvent[],
  getThreshold: (baker: TzAddress) => number,
  missedCounts: Map<TzAddress, number>,
): Generator<CheckHealthResult> {
  for (const { baker, kind } of events) {
    const threshold = getThreshold(baker);
    const count = missedCounts.get(baker) || 0;
    if (missedKinds.has(kind)) {
      const newCount = count + 1;
      yield {
        event: newCount === threshold ? Events.BakerUnhealthy : undefined,
        baker,
        newCount,
      };
    } else if (successKinds.has(kind) && count > 0) {
      yield {
        event: count >= threshold ? Events.BakerRecovered : undefined,
        baker,
        newCount: 0,
      };
    }
  }
}
```

- [ ] **Step 6: Run tests and confirm pass**

Run: `yarn test src/bakerMonitor.test.ts -t "checkHealth"`
Expected: all `checkHealth` tests PASS, including the new per-baker case.

- [ ] **Step 7: Build, lint, commit**

```bash
yarn build
yarn lint src/bakerMonitor.ts src/bakerMonitor.test.ts
git add backend/src/bakerMonitor.ts backend/src/bakerMonitor.test.ts backend/dist
git commit -m "refactor(bakerMonitor): checkHealth takes a per-baker threshold callback"
```

---

## Task 4: Wire `BakerMonitor.create` to the registry

**Files:**
- Modify: `backend/src/bakerMonitor.ts:49-156` (config type, create function)

- [ ] **Step 1: Update `BakerMonitorConfig` to allow optional registry injection at create time**

The current type stays unchanged (the registry is passed as a separate argument). Edit `backend/src/bakerMonitor.ts:49-55` — leave it as-is. The change is in `create()` and the call site in `run.ts` (Task 11).

- [ ] **Step 2: Update `create` to accept the registry and use it**

Edit `backend/src/bakerMonitor.ts:94-110`:

```ts
import type { BakerGroupsRegistry } from "./bakerGroups";

// ... existing code ...

export const create = async (
  storageDirectory: string,
  {
    bakers: configuredBakers,
    rpc: rpcNode,
    max_catchup_blocks: catchupLimit,
    head_distance: headDistance,
    missed_threshold: missedEventsThreshold,
  }: BakerMonitorConfig,
  rpcConfig: RpcClientConfig,
  enableHistory: boolean,
  onEvent: (event: Event) => Promise<void>,
  bakerGroups?: BakerGroupsRegistry,
): Promise<BakerMonitor> => {
  const MAX_HISTORY = Math.max(
    7,
    bakerGroups ? bakerGroups.getMaxThreshold() : missedEventsThreshold,
  );

  // ... existing code ...
```

The `bakerGroups` argument is optional so existing callers (and tests) keep working. When absent, fallback behavior equals today.

- [ ] **Step 3: Update the `checkHealth` call site to use the registry**

Edit `backend/src/bakerMonitor.ts:405-409`:

```ts
const getThreshold = (b: TzAddress) =>
  bakerGroups ? bakerGroups.getThresholdFor(b) : missedEventsThreshold;

for (const { event, baker, newCount } of checkHealth(
  events,
  getThreshold,
  missedCounts,
)) {
```

- [ ] **Step 4: Update `getMonitoredAddresses` to include group bakers**

Edit `backend/src/bakerMonitor.ts:142-156`:

```ts
const getMonitoredAddresses = async ({
  blockLevel,
  blockCycle,
}: ChainPositionInfo) => {
  if (monitorAllActiveBakers) {
    if (blockLevel < 0) return [];
    let activeBakers = activeBakersCache.get(blockCycle);
    if (!activeBakers) {
      activeBakers = await rpc.getActiveBakers(`${blockLevel}`);
      activeBakersCache.set(blockCycle, activeBakers);
    }
    return activeBakers;
  }
  if (bakerGroups) {
    // union of configured bakers + all group bakers (groups can grow at runtime)
    return [
      ...new Set([...configuredBakers, ...bakerGroups.getAllMonitoredBakers()]),
    ];
  }
  return configuredBakers;
};
```

Note: `bakerGroups.getAllMonitoredBakers()` includes `staticBakers` already (from how the registry is built in Task 11), but unioning again with `configuredBakers` here is defensive — the registry could legitimately be built without `staticBakers` and that's OK.

- [ ] **Step 5: Run the existing tests to confirm non-regression**

Run: `yarn test src/bakerMonitor.test.ts`
Expected: all tests PASS (no test exercises the new optional arg yet — that's covered in Task 11 integration).

- [ ] **Step 6: Build, lint, commit**

```bash
yarn build
yarn lint src/bakerMonitor.ts
git add backend/src/bakerMonitor.ts backend/dist
git commit -m "feat(bakerMonitor): accept optional BakerGroupsRegistry for per-baker thresholds"
```

---

## Task 5: TOML schema for `[[baker_group]]`

**Files:**
- Modify: `backend/src/config.ts` (add a section for baker groups; extend `Config` type)
- Create: `backend/src/testFixtures/baker-groups/valid.toml`
- Create: `backend/src/config.test.ts`

- [ ] **Step 1: Create the valid fixture config**

Create `backend/src/testFixtures/baker-groups/valid.toml`:

```toml
data_dir = "/tmp/pyrometer-test"

[baker_monitor]
bakers = ["tz1XJqNybPz88X84kGPLN5LFaC4oN1av75dA"]
missed_threshold = 5
rpc = "http://127.0.0.1:8732"

[[baker_group]]
name = "corporate"
bakers = ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"]
missed_threshold = 30

[[baker_group]]
name = "whales"
stake_min = "1000000000000"
missed_threshold = 75

[ui]
enabled = false
host = "127.0.0.1"
port = 2099
```

- [ ] **Step 2: Write a failing test**

Create `backend/src/config.test.ts`:

```ts
import { setLevel } from "loglevel";
import * as path from "path";
import { load } from "./config";

setLevel("SILENT");

const fixturePath = (name: string) =>
  path.join(__dirname, "testFixtures/baker-groups", name);

describe("config: baker_group parsing", () => {
  it("parses [[baker_group]] into the Config", async () => {
    // load() uses yargs/nconf at module scope; we drive it via argv override
    const argv = ["--config", fixturePath("valid.toml")];
    process.argv = [process.argv[0], process.argv[1], ...argv];
    const config = await load(undefined, false);
    expect(config.bakerGroups).toBeDefined();
    expect(config.bakerGroups.length).toEqual(2);
    expect(config.bakerGroups[0].name).toEqual("corporate");
    expect(config.bakerGroups[0].bakers).toEqual([
      "tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26",
    ]);
    expect(config.bakerGroups[0].missed_threshold).toEqual(30);
    expect(config.bakerGroups[1].name).toEqual("whales");
    expect(config.bakerGroups[1].stake_min).toEqual("1000000000000");
    expect(config.bakerGroups[1].missed_threshold).toEqual(75);
  });
});
```

- [ ] **Step 3: Run the test and confirm failure**

Run: `yarn test src/config.test.ts`
Expected: FAIL — `config.bakerGroups` is undefined.

- [ ] **Step 4: Add `bakerGroups` to the `Config` type**

Edit `backend/src/config.ts:1045-1063`, add inside the `Config` type:

```ts
export type Config = {
  bakerMonitor: BakerMonitorConfig;
  bakerGroups: import("./bakerGroups").RawBakerGroupConfig[];
  nodeMonitor: NodeMonitorConfig;
  // ... rest unchanged
};
```

- [ ] **Step 5: Add the getter inside `load()`**

Edit `backend/src/config.ts:1232-1280` (the returned `config` literal). Add a getter:

```ts
get bakerGroups() {
  const raw = (nconf.get("baker_group") as unknown[]) || [];
  return raw as import("./bakerGroups").RawBakerGroupConfig[];
},
```

Place it right after the existing `get bakerMonitor()`.

- [ ] **Step 6: Run the test and confirm pass**

Run: `yarn test src/config.test.ts`
Expected: PASS — the array is now read from nconf as-is. Validation comes in Task 6.

- [ ] **Step 7: Build, lint, commit**

```bash
yarn build
yarn lint src/config.ts src/config.test.ts
git add backend/src/config.ts backend/src/config.test.ts backend/src/testFixtures/baker-groups backend/dist
git commit -m "feat(config): parse [[baker_group]] sections from TOML"
```

---

## Task 6: Validation rules for `[[baker_group]]`

**Files:**
- Modify: `backend/src/config.ts` (add validation pass for `baker_group`)
- Create: `backend/src/testFixtures/baker-groups/invalid-*.toml` (several)
- Modify: `backend/src/config.test.ts`

- [ ] **Step 1: Create invalid fixtures**

Each file is the minimal required structure plus the specific defect.

`backend/src/testFixtures/baker-groups/invalid-no-name.toml`:
```toml
data_dir = "/tmp/p"
[baker_monitor]
bakers = []
rpc = "http://127.0.0.1:8732"
missed_threshold = 5
[[baker_group]]
bakers = ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"]
missed_threshold = 30
```

`backend/src/testFixtures/baker-groups/invalid-duplicate-name.toml`:
```toml
data_dir = "/tmp/p"
[baker_monitor]
bakers = []
rpc = "http://127.0.0.1:8732"
missed_threshold = 5
[[baker_group]]
name = "g"
bakers = ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"]
missed_threshold = 30
[[baker_group]]
name = "g"
bakers = ["tz1XJqNybPz88X84kGPLN5LFaC4oN1av75dA"]
missed_threshold = 30
```

`backend/src/testFixtures/baker-groups/invalid-no-bakers-no-stake.toml`:
```toml
data_dir = "/tmp/p"
[baker_monitor]
bakers = []
rpc = "http://127.0.0.1:8732"
missed_threshold = 5
[[baker_group]]
name = "g"
missed_threshold = 30
```

`backend/src/testFixtures/baker-groups/invalid-both-bakers-and-stake.toml`:
```toml
data_dir = "/tmp/p"
[baker_monitor]
bakers = []
rpc = "http://127.0.0.1:8732"
missed_threshold = 5
[[baker_group]]
name = "g"
bakers = ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"]
stake_min = "1000000000000"
missed_threshold = 30
```

`backend/src/testFixtures/baker-groups/invalid-bad-threshold.toml`:
```toml
data_dir = "/tmp/p"
[baker_monitor]
bakers = []
rpc = "http://127.0.0.1:8732"
missed_threshold = 5
[[baker_group]]
name = "g"
bakers = ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"]
missed_threshold = 0
```

`backend/src/testFixtures/baker-groups/invalid-bad-name.toml`:
```toml
data_dir = "/tmp/p"
[baker_monitor]
bakers = []
rpc = "http://127.0.0.1:8732"
missed_threshold = 5
[[baker_group]]
name = "BadName!"
bakers = ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"]
missed_threshold = 30
```

`backend/src/testFixtures/baker-groups/invalid-bad-address.toml`:
```toml
data_dir = "/tmp/p"
[baker_monitor]
bakers = []
rpc = "http://127.0.0.1:8732"
missed_threshold = 5
[[baker_group]]
name = "g"
bakers = ["not-a-tz-address"]
missed_threshold = 30
```

- [ ] **Step 2: Write failing validation tests**

Append to `backend/src/config.test.ts`:

```ts
import {
  validateBakerGroups,
  BakerGroupValidationError,
} from "./config";

describe("config: baker_group validation", () => {
  it("rejects a group without a name", () => {
    expect(() =>
      validateBakerGroups([
        { bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 } as any,
      ]),
    ).toThrow(/'name' is required/);
  });

  it("rejects duplicate names", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 },
        { name: "g", bakers: ["tz1XJqNybPz88X84kGPLN5LFaC4oN1av75dA"], missed_threshold: 30 },
      ]),
    ).toThrow(/duplicate name "g"/);
  });

  it("rejects a group with neither bakers nor stake_min", () => {
    expect(() =>
      validateBakerGroups([{ name: "g", missed_threshold: 30 } as any]),
    ).toThrow(/must define either 'bakers' or 'stake_min'/);
  });

  it("rejects a group with both bakers and stake_min", () => {
    expect(() =>
      validateBakerGroups([
        {
          name: "g",
          bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"],
          stake_min: "1000000000000",
          missed_threshold: 30,
        },
      ]),
    ).toThrow(/'bakers' and 'stake_min' are mutually exclusive/);
  });

  it("rejects missed_threshold <= 0", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 0 },
      ]),
    ).toThrow(/'missed_threshold' must be > 0/);
  });

  it("rejects names not matching [a-z][a-z0-9_-]*", () => {
    expect(() =>
      validateBakerGroups([
        { name: "BadName!", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 },
      ]),
    ).toThrow(/name must match/);
  });

  it("rejects invalid tz addresses inside bakers", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", bakers: ["not-a-tz-address"], missed_threshold: 30 },
      ]),
    ).toThrow(/invalid address/);
  });

  it("rejects stake_min <= 0", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", stake_min: "0", missed_threshold: 30 },
      ]),
    ).toThrow(/'stake_min' must be > 0/);
  });

  it("accepts a valid set", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g1", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 },
        { name: "g2", stake_min: "1000000000000", missed_threshold: 75 },
      ]),
    ).not.toThrow();
  });
});
```

- [ ] **Step 3: Run the tests and confirm failure**

Run: `yarn test src/config.test.ts -t "baker_group validation"`
Expected: FAIL — `validateBakerGroups` not exported.

- [ ] **Step 4: Implement `validateBakerGroups` in `config.ts`**

Add near the bottom of `backend/src/config.ts`, just before `export const load`:

```ts
export class BakerGroupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BakerGroupValidationError";
  }
}

const NAME_RE = /^[a-z][a-z0-9_-]*$/;

export const validateBakerGroups = (
  raw: import("./bakerGroups").RawBakerGroupConfig[],
): void => {
  const seen = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    const g = raw[i];
    if (!g.name) {
      throw new BakerGroupValidationError(
        `baker_group #${i}: 'name' is required`,
      );
    }
    if (!NAME_RE.test(g.name)) {
      throw new BakerGroupValidationError(
        `baker_group "${g.name}": name must match [a-z][a-z0-9_-]*`,
      );
    }
    if (seen.has(g.name)) {
      throw new BakerGroupValidationError(
        `baker_group: duplicate name "${g.name}"`,
      );
    }
    seen.add(g.name);

    const hasBakers = Array.isArray(g.bakers) && g.bakers.length > 0;
    const hasStake = g.stake_min !== undefined;
    if (!hasBakers && !hasStake) {
      throw new BakerGroupValidationError(
        `baker_group "${g.name}": must define either 'bakers' or 'stake_min'`,
      );
    }
    if (hasBakers && hasStake) {
      throw new BakerGroupValidationError(
        `baker_group "${g.name}": 'bakers' and 'stake_min' are mutually exclusive`,
      );
    }

    if (typeof g.missed_threshold !== "number" || g.missed_threshold <= 0) {
      throw new BakerGroupValidationError(
        `baker_group "${g.name}": 'missed_threshold' must be > 0`,
      );
    }

    if (hasBakers) {
      for (const addr of g.bakers!) {
        if (validateAddress(addr) !== TzValidationResult.VALID) {
          throw new BakerGroupValidationError(
            `baker_group "${g.name}": invalid address ${addr}`,
          );
        }
      }
    }
    if (hasStake) {
      let stake: bigint;
      try {
        stake = BigInt(g.stake_min as string);
      } catch {
        throw new BakerGroupValidationError(
          `baker_group "${g.name}": 'stake_min' must be a positive integer`,
        );
      }
      if (stake <= 0n) {
        throw new BakerGroupValidationError(
          `baker_group "${g.name}": 'stake_min' must be > 0`,
        );
      }
    }
  }
};
```

- [ ] **Step 5: Call validation inside `load()` before returning the Config**

In `backend/src/config.ts`, inside `load()`, just after the existing validation block (`if (validate) { ... }`), add:

```ts
const rawBakerGroups = (nconf.get("baker_group") as
  | import("./bakerGroups").RawBakerGroupConfig[]
  | undefined) || [];
try {
  validateBakerGroups(rawBakerGroups);
} catch (err) {
  if (err instanceof BakerGroupValidationError) {
    console.error("Invalid config");
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
```

- [ ] **Step 6: Run the tests and confirm pass**

Run: `yarn test src/config.test.ts`
Expected: all tests PASS (the valid-set test plus all the rejection tests).

- [ ] **Step 7: Build, lint, commit**

```bash
yarn build
yarn lint src/config.ts src/config.test.ts
git add backend/src/config.ts backend/src/config.test.ts backend/src/testFixtures/baker-groups backend/dist
git commit -m "feat(config): validate [[baker_group]] entries with explicit error messages"
```

---

## Task 7: Resolve `@group:X` in sender `bakers` lists

**Files:**
- Modify: `backend/src/senders/slack.ts:7-15` (type widening)
- Modify: `backend/src/senders/telegram.ts:14-22` (type widening)
- Modify: `backend/src/senders/email.ts:18-26` (type widening)
- Modify: `backend/src/senders/desktop.ts:10-17` (type widening)
- Create: `backend/src/senderBakersResolver.ts` (turns `bakers: string[]` containing `@group:X` into a `() => string[]`)
- Create: `backend/src/senderBakersResolver.test.ts`

- [ ] **Step 1: Failing test for the resolver**

Create `backend/src/senderBakersResolver.test.ts`:

```ts
import { setLevel } from "loglevel";
import { create as createRegistry } from "./bakerGroups";
import { resolveSenderBakers } from "./senderBakersResolver";

setLevel("SILENT");

const A = "tz1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const B = "tz1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const C = "tz1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

describe("resolveSenderBakers", () => {
  it("returns undefined when input is undefined", () => {
    const reg = createRegistry([], 5, []);
    expect(resolveSenderBakers(undefined, reg)).toBeUndefined();
  });

  it("returns a string[] unchanged when no @group: ref is present", () => {
    const reg = createRegistry([], 5, []);
    expect(resolveSenderBakers([A, B], reg)).toEqual([A, B]);
  });

  it("returns a callback when at least one @group: ref is present", () => {
    const reg = createRegistry(
      [{ name: "whales", bakers: [A, B], missed_threshold: 75 }],
      5,
      [],
    );
    const r = resolveSenderBakers(["@group:whales", C], reg);
    expect(typeof r).toEqual("function");
    expect((r as () => string[])().sort()).toEqual([A, B, C].sort());
  });

  it("callback reflects live changes to the group", () => {
    const reg = createRegistry(
      [{ name: "whales", stake_min: "1000000000000", missed_threshold: 75 }],
      5,
      [],
    );
    const r = resolveSenderBakers(["@group:whales"], reg) as () => string[];
    expect(r()).toEqual([]);
    reg.setGroupBakers("whales", [A, B]);
    expect(r().sort()).toEqual([A, B].sort());
  });

  it("throws for an unknown @group: reference", () => {
    const reg = createRegistry([], 5, []);
    expect(() => resolveSenderBakers(["@group:nope"], reg)).toThrow(
      /unknown group "nope"/,
    );
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `yarn test src/senderBakersResolver.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the resolver**

Create `backend/src/senderBakersResolver.ts`:

```ts
import type { BakerGroupsRegistry } from "./bakerGroups";

const GROUP_PREFIX = "@group:";

export const resolveSenderBakers = (
  input: string[] | undefined,
  registry: BakerGroupsRegistry,
): string[] | (() => string[]) | undefined => {
  if (input === undefined) return undefined;

  const literals: string[] = [];
  const groupNames: string[] = [];
  let hasGroupRef = false;

  for (const entry of input) {
    if (entry.startsWith(GROUP_PREFIX)) {
      const name = entry.slice(GROUP_PREFIX.length);
      if (!registry.getGroup(name)) {
        throw new Error(
          `sender bakers: unknown group "${name}" (referenced as "${entry}")`,
        );
      }
      groupNames.push(name);
      hasGroupRef = true;
    } else {
      literals.push(entry);
    }
  }

  if (!hasGroupRef) return literals;

  return () => {
    const set = new Set<string>(literals);
    for (const name of groupNames) {
      const g = registry.getGroup(name);
      if (g) g.bakers.forEach((b) => set.add(b));
    }
    return [...set];
  };
};
```

- [ ] **Step 4: Run and confirm pass**

Run: `yarn test src/senderBakersResolver.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Widen sender config types**

For each of `senders/slack.ts`, `senders/telegram.ts`, `senders/email.ts`, `senders/desktop.ts`, change the `bakers` field type. Concretely:

`backend/src/senders/slack.ts:14`:

```ts
import type { BakersFilter } from "../events";
// ...
export type SlackConfig = {
  enabled: boolean;
  url: string;
  emoji: boolean;
  short_address: boolean;
  alias: TzAddressAliasMap;
  exclude: Events[];
  bakers: BakersFilter;
};
```

Repeat the same pattern for `telegram.ts`, `email.ts`, `desktop.ts` (change `bakers: string[] | undefined` to `bakers: BakersFilter` and add the import).

- [ ] **Step 6: Run all sender tests for non-regression**

Run: `yarn test src/senders`
Expected: PASS (the types only widen; existing string[] callers still compile).

- [ ] **Step 7: Build, lint, commit**

```bash
yarn build
yarn lint src/senderBakersResolver.ts src/senderBakersResolver.test.ts src/senders
git add backend/src/senderBakersResolver.ts backend/src/senderBakersResolver.test.ts backend/src/senders backend/dist
git commit -m "feat(senders): resolve @group:X references via BakerGroupsRegistry"
```

---

## Task 8: `rpc.getStakingBalance`

**Files:**
- Modify: `backend/src/rpc/client.ts` (interface around line 99 and impl around line 392)

- [ ] **Step 1: Read the existing helper and types**

Run: `sed -n '380,410p' backend/src/rpc/client.ts`
Run: `sed -n '90,115p' backend/src/rpc/client.ts`

You should see `fetchDelegateField(pkh, block, "staking_balance")` already returning a string. We will surface it as a typed method.

- [ ] **Step 2: Add type signature to the client interface**

Edit `backend/src/rpc/client.ts:99-106` (the public interface block). Add:

```ts
getStakingBalance: (pkh: TzAddress, block?: string) => Promise<bigint>;
```

- [ ] **Step 3: Implement the method**

Edit the implementation block around line 392-403. Add:

```ts
getStakingBalance: async (pkh: TzAddress, block = "head") => {
  const raw = await fetchDelegateField(pkh, block, "staking_balance");
  return BigInt(raw);
},
```

Place it next to the existing `getDelegate` method so they sit together.

- [ ] **Step 4: Compile only — no test added in this task (covered indirectly by Task 9)**

Run: `yarn tsc --noEmit`
Expected: no type errors.

- [ ] **Step 5: Build, lint, commit**

```bash
yarn build
yarn lint src/rpc/client.ts
git add backend/src/rpc/client.ts backend/dist
git commit -m "feat(rpc): add getStakingBalance helper returning bigint mutez"
```

---

## Task 9: `whalesRefresh` service

**Files:**
- Create: `backend/src/whalesRefresh.ts`
- Create: `backend/src/whalesRefresh.test.ts`

- [ ] **Step 1: Failing test**

Create `backend/src/whalesRefresh.test.ts`:

```ts
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { setLevel } from "loglevel";
import { create as createRegistry } from "./bakerGroups";
import { refreshOnce, loadCache, saveCache } from "./whalesRefresh";

setLevel("SILENT");

const A = "tz1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const B = "tz1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const C = "tz1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

const mkRpc = (overrides: Partial<{ active: string[]; stakes: Record<string, bigint>; failAt?: Set<string> }> = {}) => ({
  getActiveBakers: async () => overrides.active ?? [A, B, C],
  getStakingBalance: async (pkh: string) => {
    if (overrides.failAt?.has(pkh)) throw new Error("rpc fail");
    return (overrides.stakes ?? { [A]: 2_000_000_000_000n, [B]: 500_000_000_000n, [C]: 3_000_000_000_000n })[pkh] ?? 0n;
  },
});

describe("whalesRefresh.refreshOnce", () => {
  it("updates the group with bakers above stake_min", async () => {
    const reg = createRegistry(
      [{ name: "whales", stake_min: "1000000000000", missed_threshold: 75 }],
      5,
      [],
    );
    const rpc = mkRpc();
    await refreshOnce(reg, rpc as any, { concurrency: 2 });
    expect(reg.getGroup("whales")!.bakers).toEqual(new Set([A, C]));
  });

  it("keeps previous list and returns false when getActiveBakers fails", async () => {
    const reg = createRegistry(
      [{ name: "whales", stake_min: "1000000000000", missed_threshold: 75 }],
      5,
      [],
    );
    reg.setGroupBakers("whales", [A]);
    const rpc = {
      getActiveBakers: async () => {
        throw new Error("down");
      },
      getStakingBalance: async () => 0n,
    };
    const result = await refreshOnce(reg, rpc as any, { concurrency: 2 });
    expect(result).toEqual(false);
    expect(reg.getGroup("whales")!.bakers).toEqual(new Set([A]));
  });

  it("aborts the refresh when >= 50% of stake fetches fail", async () => {
    const reg = createRegistry(
      [{ name: "whales", stake_min: "1000000000000", missed_threshold: 75 }],
      5,
      [],
    );
    reg.setGroupBakers("whales", [A]);
    const rpc = mkRpc({ failAt: new Set([B, C]) });
    const result = await refreshOnce(reg, rpc as any, { concurrency: 2 });
    expect(result).toEqual(false);
    expect(reg.getGroup("whales")!.bakers).toEqual(new Set([A]));
  });

  it("accepts the refresh when < 50% of stake fetches fail", async () => {
    const reg = createRegistry(
      [{ name: "whales", stake_min: "1000000000000", missed_threshold: 75 }],
      5,
      [],
    );
    const rpc = mkRpc({ failAt: new Set([B]) });
    const result = await refreshOnce(reg, rpc as any, { concurrency: 2 });
    expect(result).toEqual(true);
    expect(reg.getGroup("whales")!.bakers).toEqual(new Set([A, C]));
  });
});

describe("whalesRefresh cache", () => {
  it("saves and reloads the cache from disk", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pyro-cache-"));
    const file = path.join(dir, "whales-cache.json");
    await saveCache(file, { whales: [A, B] });
    const loaded = await loadCache(file);
    expect(loaded).toEqual({ whales: [A, B] });
  });

  it("returns empty object when cache file is missing", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pyro-cache-"));
    const file = path.join(dir, "nope.json");
    expect(await loadCache(file)).toEqual({});
  });

  it("returns empty object when cache file is corrupt", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pyro-cache-"));
    const file = path.join(dir, "bad.json");
    fs.writeFileSync(file, "{not json");
    expect(await loadCache(file)).toEqual({});
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `yarn test src/whalesRefresh.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `whalesRefresh.ts`**

Create `backend/src/whalesRefresh.ts`:

```ts
import * as fs from "fs/promises";
import { getLogger } from "loglevel";
import type { BakerGroupsRegistry } from "./bakerGroups";
import * as service from "./service";

const log = getLogger("whales-refresh");

type StakeRpc = {
  getActiveBakers: (block?: string) => Promise<string[]>;
  getStakingBalance: (pkh: string, block?: string) => Promise<bigint>;
};

export type WhalesCache = Record<string, string[]>;

export const loadCache = async (filePath: string): Promise<WhalesCache> => {
  try {
    const txt = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(txt);
    if (parsed && typeof parsed === "object") return parsed as WhalesCache;
    return {};
  } catch {
    return {};
  }
};

export const saveCache = async (
  filePath: string,
  cache: WhalesCache,
): Promise<void> => {
  await fs.writeFile(filePath, JSON.stringify(cache, null, 2));
};

type Options = {
  concurrency?: number;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  fn: (x: T) => Promise<R>,
): Promise<Array<{ ok: true; value: R } | { ok: false; error: unknown }>> => {
  const results: Array<{ ok: true; value: R } | { ok: false; error: unknown }> =
    new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      try {
        results[i] = { ok: true, value: await fn(items[i]) };
      } catch (error) {
        results[i] = { ok: false, error };
      }
    }
  });
  await Promise.all(workers);
  return results;
};

export const refreshOnce = async (
  registry: BakerGroupsRegistry,
  rpc: StakeRpc,
  opts: Options = {},
): Promise<boolean> => {
  const concurrency = opts.concurrency ?? 10;
  const stakeGroups = registry
    .listGroups()
    .filter((g) => g.kind === "stake" && g.stake_min !== undefined);
  if (stakeGroups.length === 0) return true;

  let active: string[];
  try {
    active = await rpc.getActiveBakers();
  } catch (err) {
    log.warn("getActiveBakers failed, keeping previous group lists", err);
    return false;
  }

  const stakes = await mapWithConcurrency(active, concurrency, (pkh) =>
    rpc.getStakingBalance(pkh),
  );
  const failures = stakes.filter((s) => !s.ok).length;
  if (failures * 2 >= stakes.length) {
    log.warn(
      `>=50% staking_balance failures (${failures}/${stakes.length}), aborting refresh`,
    );
    return false;
  }

  for (const g of stakeGroups) {
    const minStake = g.stake_min!;
    const matched: string[] = [];
    for (let i = 0; i < active.length; i++) {
      const r = stakes[i];
      if (r.ok && r.value >= minStake) matched.push(active[i]);
    }
    registry.setGroupBakers(g.name, matched);
    log.info(`Group "${g.name}" refreshed: ${matched.length} bakers`);
  }
  return true;
};

export const create = (
  registry: BakerGroupsRegistry,
  rpc: StakeRpc,
  cacheFile: string,
  refreshIntervalMs: number,
  concurrency = 10,
): service.Service => {
  // hydrate from disk cache on creation; the first network refresh runs asynchronously
  let firstRun = true;

  const task = async () => {
    if (firstRun) {
      firstRun = false;
      const cache = await loadCache(cacheFile);
      for (const [name, addrs] of Object.entries(cache)) {
        if (registry.getGroup(name)) registry.setGroupBakers(name, addrs);
      }
    }
    const ok = await refreshOnce(registry, rpc, { concurrency });
    if (ok) {
      const dump: WhalesCache = {};
      for (const g of registry.listGroups()) {
        if (g.kind === "stake") dump[g.name] = [...g.bakers];
      }
      try {
        await saveCache(cacheFile, dump);
      } catch (err) {
        log.warn("whales cache save failed", err);
      }
    }
  };

  return service.create("whales-refresh", task, refreshIntervalMs);
};
```

- [ ] **Step 4: Run tests and confirm pass**

Run: `yarn test src/whalesRefresh.test.ts`
Expected: 7 tests PASS.

- [ ] **Step 5: Build, lint, commit**

```bash
yarn build
yarn lint src/whalesRefresh.ts src/whalesRefresh.test.ts
git add backend/src/whalesRefresh.ts backend/src/whalesRefresh.test.ts backend/dist
git commit -m "feat(whales): add periodic stake-based group refresh with disk cache"
```

---

## Task 10: Discord sender

**Files:**
- Create: `backend/src/senders/discord.ts`
- Create: `backend/src/senders/discord.test.ts`

- [ ] **Step 1: Failing test**

Create `backend/src/senders/discord.test.ts`:

```ts
import { setLevel } from "loglevel";
import { Events, Notification, Baked, MissedEndorsement, BakerUnhealthy } from "../events";
import { create, DiscordConfig } from "./discord";

setLevel("SILENT");

const mkBaked = (): Baked => ({
  kind: Events.Baked,
  createdAt: new Date("2026-05-26T08:00:00Z"),
  baker: "tz1AAAAAAAAAA",
  cycle: 1,
  level: 1,
  priority: 0,
  timestamp: new Date("2026-05-26T08:00:00Z"),
});

const mkUnhealthy = (): BakerUnhealthy => ({
  kind: Events.BakerUnhealthy,
  baker: "tz1AAAAAAAAAA",
  cycle: 1,
  level: 1,
  createdAt: new Date("2026-05-26T08:00:00Z"),
  timestamp: new Date("2026-05-26T08:00:00Z"),
});

const mkConfig = (overrides: Partial<DiscordConfig> = {}): DiscordConfig => ({
  enabled: true,
  url: "https://discord.example/webhook",
  emoji: true,
  short_address: true,
  alias: {},
  exclude: [],
  bakers: undefined,
  ...overrides,
});

describe("discord sender", () => {
  let postedBodies: any[] = [];
  let nextResponses: Array<{ status: number; headers?: Record<string, string> }> = [];

  beforeEach(() => {
    postedBodies = [];
    nextResponses = [];
    (global as any).fetch = jest.fn(async (_url: string, init: any) => {
      postedBodies.push(JSON.parse(init.body));
      const r = nextResponses.shift() ?? { status: 204 };
      return {
        status: r.status,
        ok: r.status < 400,
        headers: { get: (k: string) => r.headers?.[k.toLowerCase()] ?? null },
      };
    });
  });

  it("posts one POST per <=10 embeds", async () => {
    const events = Array.from({ length: 12 }, mkBaked);
    const sender = create(mkConfig());
    await sender(events);
    expect(postedBodies.length).toEqual(2);
    expect(postedBodies[0].embeds.length).toEqual(10);
    expect(postedBodies[1].embeds.length).toEqual(2);
  });

  it("colors BakerUnhealthy red, Baked gray, Missed* orange", async () => {
    const sender = create(mkConfig());
    await sender([mkBaked(), mkUnhealthy()]);
    const colors = postedBodies[0].embeds.map((e: any) => e.color);
    // Baked = gray (0x95a5a6), BakerUnhealthy = red (0xe74c3c)
    expect(colors).toEqual([0x95a5a6, 0xe74c3c]);
  });

  it("filters by exclude (event kind)", async () => {
    const sender = create(mkConfig({ exclude: [Events.Baked] }));
    await sender([mkBaked(), mkUnhealthy()]);
    expect(postedBodies[0].embeds.length).toEqual(1);
  });

  it("filters by bakers callback (dynamic)", async () => {
    let allow = new Set(["tz1AAAAAAAAAA"]);
    const sender = create(mkConfig({ bakers: () => [...allow] }));
    await sender([mkBaked()]);
    expect(postedBodies.length).toEqual(1);
    postedBodies = [];
    allow = new Set(["tz1ZZZ"]);
    await sender([mkBaked()]);
    expect(postedBodies.length).toEqual(0);
  });

  it("respects Retry-After on HTTP 429", async () => {
    jest.useFakeTimers();
    nextResponses = [
      { status: 429, headers: { "retry-after": "0" } },
      { status: 204 },
    ];
    const sender = create(mkConfig());
    const p = sender([mkBaked()]);
    await jest.runAllTimersAsync();
    await p;
    expect(postedBodies.length).toEqual(2); // retried
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `yarn test src/senders/discord.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `senders/discord.ts`**

Create `backend/src/senders/discord.ts`:

```ts
import { Event, Events, Sender, FilteredSender, BakersFilter } from "../events";
import format from "../format";
import { chunk } from "lodash";
import type { TzAddressAliasMap } from "../config";
import { getLogger } from "loglevel";

const log = getLogger("discord");

export type DiscordConfig = {
  enabled: boolean;
  url: string;
  emoji: boolean;
  short_address: boolean;
  alias: TzAddressAliasMap;
  exclude: Events[];
  bakers: BakersFilter;
  username?: string;
};

const colorFor = (kind: Events): number => {
  switch (kind) {
    case Events.BakerUnhealthy:
      return 0xe74c3c; // red
    case Events.BakerRecovered:
      return 0x2ecc71; // green
    case Events.MissedBake:
    case Events.MissedEndorsement:
    case Events.MissedBonus:
      return 0xe67e22; // orange
    case Events.DeactivationRisk:
    case Events.Deactivated:
      return 0xc0392b; // dark red
    default:
      return 0x95a5a6; // gray
  }
};

const formatOne = (event: Event, config: DiscordConfig): { title: string; description: string; color: number } => {
  const [line] = format([event], config.emoji, config.short_address, false, config.alias);
  const title = "kind" in event ? String(event.kind) : "event";
  return {
    title,
    description: line ?? title,
    color: colorFor((event as any).kind ?? Events.Notification),
  };
};

const postWithRetry = async (
  url: string,
  body: unknown,
  maxRetries = 3,
): Promise<void> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "1");
      log.warn(`discord 429, waiting ${retryAfter}s`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`discord webhook returned ${res.status}`);
    }
    return;
  }
  throw new Error("discord webhook: max retries exceeded after 429s");
};

export const create = (config: DiscordConfig): Sender => {
  return FilteredSender(async (events: Event[]) => {
    if (events.length === 0) return;
    const embeds = events.map((e) => formatOne(e, config));
    for (const batch of chunk(embeds, 10)) {
      const body: any = { embeds: batch };
      if (config.username) body.username = config.username;
      await postWithRetry(config.url, body);
    }
  }, config);
};
```

- [ ] **Step 4: Run and confirm pass**

Run: `yarn test src/senders/discord.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Add Discord config keys to `config.ts`**

In `backend/src/config.ts`, locate the existing sender blocks (search for `SLACK_KEY`). Mirror that structure for Discord. Concretely:

Around line ~280 (after the Slack block), add:

```ts
const DISCORD_GROUP: Group = { key: "discord", label: "Discord:" };
const DISCORD_KEY = DISCORD_GROUP.key;

const DISCORD_ENABLED: UserPref = {
  key: `${DISCORD_KEY}:enabled`,
  default: false,
  description: "Enable Discord webhook notifications",
  alias: undefined,
  type: "boolean",
  group: DISCORD_GROUP.label,
  isArray: false,
  validationRule: "boolean",
};
const DISCORD_URL: UserPref = {
  key: `${DISCORD_KEY}:url`,
  default: "",
  description: "Discord webhook URL",
  alias: undefined,
  type: "string",
  group: DISCORD_GROUP.label,
  isArray: false,
  validationRule: ["string", { required_if: [`${DISCORD_KEY}.enabled`, true] }],
};
const DISCORD_EMOJI: UserPref = {
  key: `${DISCORD_KEY}:emoji`,
  default: true,
  description: "Use emoji in messages",
  alias: undefined,
  type: "boolean",
  group: DISCORD_GROUP.label,
  isArray: false,
  validationRule: "boolean",
};
const DISCORD_SHORT: UserPref = {
  key: `${DISCORD_KEY}:short_address`,
  default: true,
  description: "Shorten addresses",
  alias: undefined,
  type: "boolean",
  group: DISCORD_GROUP.label,
  isArray: false,
  validationRule: "boolean",
};
const DISCORD_USERNAME: UserPref = {
  key: `${DISCORD_KEY}:username`,
  default: "",
  description: "Override webhook username",
  alias: undefined,
  type: "string",
  group: DISCORD_GROUP.label,
  isArray: false,
  validationRule: "string",
};
const DISCORD_EXCLUDE: UserPref = mkExcludeEventsPref(
  `${DISCORD_KEY}:exclude`,
  undefined,
  [],
);
const DISCORD_BAKERS: UserPref = {
  key: `${DISCORD_KEY}:bakers`,
  default: undefined,
  description: "Restrict notifications to these bakers (literal addresses or @group:NAME)",
  alias: undefined,
  type: "string",
  group: DISCORD_GROUP.label,
  isArray: true,
  validationRule: "array",
};
```

Then add these prefs to the `userPrefs` array (find the existing `const userPrefs = [` and append the Discord ones near the other sender prefs).

Then add a getter and update the `Config` type:

In the `Config` type around line 1050:
```ts
discord: import("./senders/discord").DiscordConfig;
```

In the `config` literal:
```ts
get discord() {
  return nconf.get(DISCORD_KEY) as import("./senders/discord").DiscordConfig;
},
```

Also call `createAliasMap(DISCORD_KEY);` next to the other `createAliasMap` calls.

- [ ] **Step 6: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Build, lint, commit**

```bash
yarn build
yarn lint src/senders/discord.ts src/senders/discord.test.ts src/config.ts
git add backend/src/senders/discord.ts backend/src/senders/discord.test.ts backend/src/config.ts backend/dist
git commit -m "feat(senders): add Discord webhook sender with embeds"
```

---

## Task 11: Wire it all in `run.ts`

**Files:**
- Modify: `backend/src/run.ts`

- [ ] **Step 1: Read the current run.ts wiring**

Run: `sed -n '1,100p' backend/src/run.ts`
Run: `sed -n '200,260p' backend/src/run.ts`

- [ ] **Step 2: Build the registry near the top of `run`**

Edit `backend/src/run.ts`. After `const storageDir = normalizePath(config.storageDirectory);` (around line 34), add:

```ts
import { create as createBakerGroups } from "./bakerGroups";
import * as WhalesRefresh from "./whalesRefresh";
import { resolveSenderBakers } from "./senderBakersResolver";
import { create as DiscordSender } from "./senders/discord";
import { join as joinPath } from "path";
```

(Some of these imports may already exist — keep the file deduped.)

Then, right before the `const createChannel` declaration (around line 53), insert:

```ts
const bakerGroups = createBakerGroups(
  config.bakerGroups ?? [],
  config.bakerMonitor.missed_threshold,
  config.bakerMonitor.bakers,
);
```

- [ ] **Step 3: Wrap each sender's `bakers` through the resolver**

Replace each sender instantiation block. For example, for Slack (around line 93):

```ts
const slackConfig = config.slack;
if (slackConfig?.enabled) {
  const resolved = {
    ...slackConfig,
    bakers: resolveSenderBakers(
      Array.isArray(slackConfig.bakers) ? slackConfig.bakers : undefined,
      bakerGroups,
    ),
  };
  channels.push(await createChannel("slack", SlackSender(resolved)));
}
```

Repeat the same pattern for `email`, `desktop`, `webhook`, `telegram` (use `Array.isArray` to guard — at this point in code the value can only be `string[] | undefined`).

Add a new block for Discord, right after Slack:

```ts
const discordConfig = config.discord;
if (discordConfig?.enabled) {
  const resolved = {
    ...discordConfig,
    bakers: resolveSenderBakers(
      Array.isArray(discordConfig.bakers) ? discordConfig.bakers : undefined,
      bakerGroups,
    ),
  };
  channels.push(await createChannel("discord", DiscordSender(resolved)));
}
```

- [ ] **Step 4: Pass the registry to `BakerMonitor.create`**

Edit the `BakerMonitor.create(...)` call (around line 229):

```ts
const bakerMonitor =
  bakers.length > 0
    ? await BakerMonitor.create(
        storageDir,
        bakerMonitorConfig,
        config.rpc,
        uiConfig.enabled,
        onEvent,
        bakerGroups,
      )
    : null;
```

- [ ] **Step 5: Start the whales refresh service**

Right after `const bakerMonitor = ...`, add:

```ts
const cacheFile = joinPath(storageDir, "whales-cache.json");
const refreshIntervalMs = 3 * 24 * 60 * 60 * 1000; // 3 cycles ~ 72h
const hasStakeGroup = bakerGroups.listGroups().some((g) => g.kind === "stake");
const whalesService = hasStakeGroup
  ? WhalesRefresh.create(
      bakerGroups,
      {
        getActiveBakers: (block?: string) =>
          // use the same rpc the bakerMonitor uses
          import("./rpc/client").then(({ default: RpcClient }) =>
            RpcClient(bakerMonitorConfig.rpc.url, config.rpc).getActiveBakers(block ?? "head"),
          ),
        getStakingBalance: (pkh: string, block?: string) =>
          import("./rpc/client").then(({ default: RpcClient }) =>
            RpcClient(bakerMonitorConfig.rpc.url, config.rpc).getStakingBalance(pkh, block),
          ),
      },
      cacheFile,
      refreshIntervalMs,
    )
  : null;
```

(The dynamic `import("./rpc/client")` keeps changes minimal — alternatively, hoist the existing import to the top and reuse a single `RpcClient` instance. Use the cleanest form that respects the existing import layout in run.ts; the dynamic import shown here is only a fallback.)

Recommended cleaner version: import `RpcClient` from `./rpc/client` at the top of `run.ts` and build a single instance:

```ts
import RpcClient from "./rpc/client";
// ...
const sharedRpc = RpcClient(bakerMonitorConfig.rpc.url, config.rpc);
const whalesService = hasStakeGroup
  ? WhalesRefresh.create(bakerGroups, sharedRpc, cacheFile, refreshIntervalMs)
  : null;
```

Use the cleaner version.

- [ ] **Step 6: Start/stop the service in the lifecycle**

Find the `const stop = (event: NodeJS.Signals) => {` block (around line 261). Add `whalesService?.stop();` next to `bakerMonitor?.stop()`.

Find the `allTasks.push(...)` section (around line 286). Add:

```ts
if (whalesService) {
  allTasks.push(whalesService.start());
}
```

- [ ] **Step 7: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Run the full test suite**

Run: `yarn test`
Expected: all tests PASS — no regression on existing tests.

- [ ] **Step 9: Build, lint, commit**

```bash
yarn build
yarn lint src/run.ts
git add backend/src/run.ts backend/dist
git commit -m "feat(run): wire BakerGroupsRegistry, whales refresh, and Discord channel"
```

---

## Task 12: End-to-end smoke check on a sample config

**Files:**
- Create: `backend/src/testFixtures/baker-groups/smoke.toml`

- [ ] **Step 1: Create the smoke config**

Create `backend/src/testFixtures/baker-groups/smoke.toml`:

```toml
data_dir = "/tmp/pyrometer-smoke"

[baker_monitor]
bakers = ["tz1XJqNybPz88X84kGPLN5LFaC4oN1av75dA"]
missed_threshold = 5
rpc = "http://127.0.0.1:8732"
max_catchup_blocks = 1
head_distance = 2

[[baker_group]]
name = "corporate"
bakers = [
  "tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26",
  "tz1Myst5o9a66oBoxe9oW7K6GekPHzWUMbBQ",
]
missed_threshold = 30

[[baker_group]]
name = "whales"
stake_min = "1000000000000"
missed_threshold = 75

[discord]
enabled = false
url = ""

[slack]
enabled = false
url = ""

[ui]
enabled = false
host = "127.0.0.1"
port = 2099
```

- [ ] **Step 2: Dry-run the config load**

Run from `backend/`:
```bash
node -e "process.argv = [process.argv[0], 'x', '--config', 'src/testFixtures/baker-groups/smoke.toml']; require('./dist/config').load(undefined, true).then(c => { console.log('bakerGroups=', c.bakerGroups.length); console.log('fallback=', c.bakerMonitor.missed_threshold); }).catch(e => { console.error(e.message); process.exit(1); })"
```
Expected output: `bakerGroups= 2` and `fallback= 5`.

- [ ] **Step 3: Re-run the bad fixtures and verify exit 1**

For each invalid fixture in `src/testFixtures/baker-groups/invalid-*.toml`, run the same node command above and confirm:
- Exit code 1
- Stderr contains the explicit error message for that case

Example:
```bash
node -e "process.argv = [process.argv[0], 'x', '--config', 'src/testFixtures/baker-groups/invalid-duplicate-name.toml']; require('./dist/config').load(undefined, true).then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); })" ; echo exit=$?
```

Expected: `exit=1` and the message `baker_group: duplicate name "g"`.

(The test suite already covers these cases — this manual sweep is a belt-and-suspenders check before deploying.)

- [ ] **Step 4: Final commit (only if anything changed in this task)**

If the smoke fixture is the only change:

```bash
git add backend/src/testFixtures/baker-groups/smoke.toml
git commit -m "test: add baker-groups smoke fixture"
```

---

## Task 13: Update README baker-groups section (light)

**Files:**
- Modify: `README.md` (add a "Baker groups" subsection under the configuration docs)

- [ ] **Step 1: Find the configuration section in README.md**

Run: `grep -n "^#\|^##\|^###" README.md | head -30`

- [ ] **Step 2: Add a "Baker groups" subsection under the configuration section**

Append after the existing baker-monitor block (the exact heading hierarchy depends on the README, follow what's there):

```markdown
### Baker groups

You can split bakers into named groups with their own `missed_threshold`. Useful when you watch many bakers but want faster alerts for large stakers.

```toml
[[baker_group]]
name = "whales"
stake_min = "1000000000000"   # 1M tez (mutez)
missed_threshold = 75          # ~10 min on Tallinn

[[baker_group]]
name = "corporate"
bakers = ["tz1...", "tz1..."]
missed_threshold = 30
```

A group declares either an explicit `bakers` list **or** `stake_min` (mutually exclusive). Stake-based groups are refreshed automatically from the RPC every 3 cycles. Reference a group from any sender with `@group:NAME`:

```toml
[slack]
enabled = true
url = "..."
bakers = ["@group:whales", "@group:corporate"]
```

When a baker belongs to multiple groups, the lowest threshold applies.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document baker_group config and @group:NAME sender references"
```

---

## Task 14 (operational, not implementation): Deploy to VPS

This is a manual checklist, not a coding task. Run only after Tasks 1-13 are merged.

- [ ] Build the .deb (or whatever artifact your release flow produces).
- [ ] Copy / install on `baker-test-ovh.tzalpha.net` (replacing the existing `pyrometer` package).
- [ ] Edit `/home/debian/pyrometer-global.toml` to:
  - add `[[baker_group]] name="whales" stake_min="1000000000000" missed_threshold=75`
  - add `[[baker_group]] name="corporate" stake_min="100000000000" missed_threshold=150` (or any tier you want)
  - add `[discord] enabled = true`, `url = "<your webhook>"`, `bakers = ["@group:whales"]`
- [ ] `sudo systemctl restart pyrometer-global`
- [ ] `sudo journalctl -u pyrometer-global -f` — verify:
  - log line `Group "whales" refreshed: N bakers` within a few seconds (assuming RPC reachable)
  - no validation errors
  - `whales-cache.json` appears in `/home/debian/pyrometer-data-global/`
- [ ] Trigger a synthetic missed event (or wait) and confirm a Discord message lands.

---

## Self-review notes (for the planner; not for the implementer)

- **Spec coverage:** all 7 phases from the spec are addressed (T1–T2 = phase 1; T3–T4 = phase 2; T5–T7 = phase 3; T8–T9 = phase 4; T10 = phase 5; T11 = phase 6; T12–T14 = phase 7). The optional GraphQL exposure listed in the spec's "Open items" is intentionally NOT scheduled here — it is genuinely deferred until after the feature lands.
- **Placeholders:** none. Every step has the actual code or the exact command to run.
- **Type consistency:** `BakersFilter` is defined in Task 1 and reused in Tasks 7, 10. `RawBakerGroupConfig` is defined in Task 2 and referenced in Tasks 5, 6. `BakerGroupsRegistry.listGroups()` added in Task 2 is consumed by Task 9 (whalesRefresh) and Task 11 (run.ts). All names match.
