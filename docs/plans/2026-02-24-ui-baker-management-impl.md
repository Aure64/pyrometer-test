# UI Baker Management — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Settings page to the UI for managing baker addresses, aliases, and monitoring settings with hot reload, backed by a JSON overlay file.

**Architecture:** A `ConfigManager` class reads TOML (baseline) + JSON overlay (overrides), exposes getters/setters, persists changes to JSON, and emits events. The `BakerMonitor` and API context listen for changes (hot reload). GraphQL mutations (protected by a simple token auth) call ConfigManager methods. A new React Settings page provides the UI.

**Tech Stack:** TypeScript, Node.js (backend), Nexus (GraphQL), Express, React 18, Chakra UI v2, Apollo Client, Jest (tests)

---

### Task 1: Create ConfigManager — read/write JSON overlay

**Files:**
- Create: `backend/src/configManager.ts`
- Create: `backend/src/configManager.test.ts`
- Reference: `backend/src/config.ts:57` (TzAddressAliasMap type)
- Reference: `backend/src/bakerMonitor.ts:49-55` (BakerMonitorConfig type)
- Reference: `backend/src/fs-utils.ts:25-39` (readJson/writeJson)

**Step 1: Write the failing test**

Create `backend/src/configManager.test.ts`:

```typescript
import { ConfigManager } from "./configManager";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("ConfigManager", () => {
  let tmpDir: string;
  let overridesPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pyrometer-test-"));
    overridesPath = path.join(tmpDir, "overrides.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("initialization", () => {
    it("returns baseline config when no overrides file exists", () => {
      const baseline = {
        bakers: ["tz1abc"],
        aliases: { tz1abc: "Baker A" },
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      expect(cm.getBakers()).toEqual(["tz1abc"]);
      expect(cm.getAliases()).toEqual({ tz1abc: "Baker A" });
    });

    it("merges overrides on top of baseline", () => {
      fs.writeFileSync(overridesPath, JSON.stringify({
        baker_monitor: { bakers: ["tz1xyz"] },
        alias: { tz1xyz: "Baker X" },
      }));
      const baseline = {
        bakers: ["tz1abc"],
        aliases: { tz1abc: "Baker A" },
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      // bakers array is replaced, not merged
      expect(cm.getBakers()).toEqual(["tz1xyz"]);
      // aliases are merged
      expect(cm.getAliases()).toEqual({ tz1abc: "Baker A", tz1xyz: "Baker X" });
    });
  });

  describe("addBaker", () => {
    it("adds a baker and persists to overrides file", () => {
      const baseline = {
        bakers: ["tz1abc"],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      cm.addBaker("tz1new");
      expect(cm.getBakers()).toContain("tz1new");
      // check persisted
      const saved = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
      expect(saved.baker_monitor.bakers).toContain("tz1new");
    });

    it("emits bakers-changed event", () => {
      const baseline = {
        bakers: [],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      const handler = jest.fn();
      cm.on("bakers-changed", handler);
      cm.addBaker("tz1new");
      expect(handler).toHaveBeenCalledWith(["tz1new"]);
    });

    it("does not add duplicate baker", () => {
      const baseline = {
        bakers: ["tz1abc"],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      cm.addBaker("tz1abc");
      expect(cm.getBakers()).toEqual(["tz1abc"]);
    });
  });

  describe("removeBaker", () => {
    it("removes a baker and persists", () => {
      const baseline = {
        bakers: ["tz1abc", "tz1def"],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      cm.removeBaker("tz1abc");
      expect(cm.getBakers()).toEqual(["tz1def"]);
    });

    it("emits bakers-changed event", () => {
      const baseline = {
        bakers: ["tz1abc"],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      const handler = jest.fn();
      cm.on("bakers-changed", handler);
      cm.removeBaker("tz1abc");
      expect(handler).toHaveBeenCalledWith([]);
    });
  });

  describe("updateAlias", () => {
    it("sets an alias and persists", () => {
      const baseline = {
        bakers: ["tz1abc"],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      cm.updateAlias("tz1abc", "My Baker");
      expect(cm.getAliases()).toEqual({ tz1abc: "My Baker" });
    });

    it("removes an alias when value is null", () => {
      const baseline = {
        bakers: ["tz1abc"],
        aliases: { tz1abc: "My Baker" },
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      cm.updateAlias("tz1abc", null);
      expect(cm.getAliases()).toEqual({});
    });

    it("emits aliases-changed event", () => {
      const baseline = {
        bakers: [],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      const handler = jest.fn();
      cm.on("aliases-changed", handler);
      cm.updateAlias("tz1abc", "Alias");
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("updateSettings", () => {
    it("partially updates settings and persists", () => {
      const baseline = {
        bakers: [],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      cm.updateSettings({ max_catchup_blocks: 200 });
      expect(cm.getSettings().max_catchup_blocks).toBe(200);
      expect(cm.getSettings().head_distance).toBe(1); // unchanged
    });

    it("emits settings-changed event", () => {
      const baseline = {
        bakers: [],
        aliases: {},
        settings: { rpc: "https://rpc.example.com", max_catchup_blocks: 120, head_distance: 1, missed_threshold: 3 },
      };
      const cm = new ConfigManager(overridesPath, baseline);
      const handler = jest.fn();
      cm.on("settings-changed", handler);
      cm.updateSettings({ max_catchup_blocks: 200 });
      expect(handler).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /home/aurelien/pyrometer/backend && npx jest configManager.test.ts --no-coverage`
Expected: FAIL — module `./configManager` not found

**Step 3: Write minimal implementation**

Create `backend/src/configManager.ts`:

```typescript
import { EventEmitter } from "events";
import * as fs from "fs";
import { dirname } from "path";
import type { TzAddressAliasMap } from "./config";

type OverridesData = {
  baker_monitor?: {
    bakers?: string[];
    rpc?: string;
    max_catchup_blocks?: number;
    head_distance?: number;
    missed_threshold?: number;
  };
  alias?: TzAddressAliasMap;
};

export type MonitorSettings = {
  rpc: string;
  max_catchup_blocks: number;
  head_distance: number;
  missed_threshold: number;
};

type Baseline = {
  bakers: string[];
  aliases: TzAddressAliasMap;
  settings: MonitorSettings;
};

export class ConfigManager extends EventEmitter {
  private overridesPath: string;
  private baseline: Baseline;
  private overrides: OverridesData;

  constructor(overridesPath: string, baseline: Baseline) {
    super();
    this.overridesPath = overridesPath;
    this.baseline = baseline;
    this.overrides = this.loadOverrides();
  }

  private loadOverrides(): OverridesData {
    try {
      const raw = fs.readFileSync(this.overridesPath, "utf8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private persist(): void {
    const dir = dirname(this.overridesPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.overridesPath, JSON.stringify(this.overrides, null, 2), "utf8");
  }

  getBakers(): string[] {
    return this.overrides.baker_monitor?.bakers ?? this.baseline.bakers;
  }

  getAliases(): TzAddressAliasMap {
    const baseAliases = { ...this.baseline.aliases };
    const overrideAliases = this.overrides.alias ?? {};
    // Merge: override wins. Null values in override mean "delete".
    const merged = { ...baseAliases, ...overrideAliases };
    // Remove keys explicitly set to null in overrides
    for (const [key, val] of Object.entries(merged)) {
      if (val === null || val === undefined) delete merged[key];
    }
    return merged;
  }

  getSettings(): MonitorSettings {
    const base = this.baseline.settings;
    const over = this.overrides.baker_monitor ?? {};
    return {
      rpc: over.rpc ?? base.rpc,
      max_catchup_blocks: over.max_catchup_blocks ?? base.max_catchup_blocks,
      head_distance: over.head_distance ?? base.head_distance,
      missed_threshold: over.missed_threshold ?? base.missed_threshold,
    };
  }

  addBaker(address: string): void {
    const current = this.getBakers();
    if (current.includes(address)) return;
    const updated = [...current, address];
    if (!this.overrides.baker_monitor) this.overrides.baker_monitor = {};
    this.overrides.baker_monitor.bakers = updated;
    this.persist();
    this.emit("bakers-changed", updated);
  }

  removeBaker(address: string): void {
    const current = this.getBakers();
    const updated = current.filter((b) => b !== address);
    if (!this.overrides.baker_monitor) this.overrides.baker_monitor = {};
    this.overrides.baker_monitor.bakers = updated;
    this.persist();
    this.emit("bakers-changed", updated);
  }

  updateAlias(address: string, alias: string | null): void {
    if (!this.overrides.alias) this.overrides.alias = {};
    if (alias === null) {
      delete this.overrides.alias[address];
      // Also need to mark deletion if it exists in baseline
      // We handle this by not including baseline keys that are removed
    } else {
      this.overrides.alias[address] = alias;
    }
    this.persist();
    this.emit("aliases-changed", this.getAliases());
  }

  updateSettings(partial: Partial<MonitorSettings>): void {
    if (!this.overrides.baker_monitor) this.overrides.baker_monitor = {};
    Object.assign(this.overrides.baker_monitor, partial);
    this.persist();
    this.emit("settings-changed", this.getSettings());
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /home/aurelien/pyrometer/backend && npx jest configManager.test.ts --no-coverage`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add backend/src/configManager.ts backend/src/configManager.test.ts
git commit -m "feat: add ConfigManager with JSON overlay for runtime config"
```

---

### Task 2: Add auth token support to UIConfig

**Files:**
- Modify: `backend/src/api/server.ts:47-55` (UIConfig type)
- Modify: `backend/src/config.ts:59` (BAKER_GROUP area — add admin_token to UI defaults)

**Step 1: Add `admin_token` to UIConfig type**

In `backend/src/api/server.ts`, change the UIConfig type (line 47):

```typescript
// before
export type UIConfig = {
  enabled: boolean;
  host: string;
  port: number;
  explorer_url?: string;
  webroot?: string;
  show_system_info?: boolean;
  alias: TzAddressAliasMap;
};

// after
export type UIConfig = {
  enabled: boolean;
  host: string;
  port: number;
  explorer_url?: string;
  webroot?: string;
  show_system_info?: boolean;
  alias: TzAddressAliasMap;
  admin_token?: string;
};
```

**Step 2: Add admin_token to config defaults**

In `backend/src/config.ts`, find the UI_GROUP defaults section and ensure `admin_token` is included. Search for the UI config defaults (look for `UI_GROUP` userPref entries) and add:

```typescript
{
  key: `${UI_GROUP.key}:admin_token`,
  default: undefined,
  description: "Admin token for UI mutations (if unset, mutations are disabled)",
  type: "string",
  alias: undefined,
  group: UI_GROUP.label,
  isArray: false,
},
```

> **Note to implementer:** Search for the existing UI_GROUP userPref entries (around lines 400-450 in config.ts) and add this new entry alongside them.

**Step 3: Commit**

```bash
git add backend/src/api/server.ts backend/src/config.ts
git commit -m "feat: add admin_token field to UIConfig"
```

---

### Task 3: Add ConfigManager to API context

**Files:**
- Modify: `backend/src/api/context.ts` (add configManager to Context interface and createContext)

**Step 1: Update Context interface and factory**

Replace the full content of `backend/src/api/context.ts`:

```typescript
import { NodeInfoCollection } from "../nodeMonitor";
import { BakerInfoCollection } from "../bakerMonitor";
import client, { RpcClient, RpcClientConfig } from "../rpc/client";
import { createTzktClient, TzktClient } from "../tzkt/client";
import type { TzAddressAliasMap } from "../config";
import type { ConfigManager } from "../configManager";

export interface Context {
  nodeInfoCollection: NodeInfoCollection;
  bakerInfoCollection: BakerInfoCollection;
  rpc: RpcClient;
  explorerUrl: string | undefined;
  showSystemInfo: boolean | undefined;
  aliasMap: TzAddressAliasMap;
  tzkt: TzktClient;
  configManager: ConfigManager | null;
  adminToken: string | undefined;
}

export const createContext = (
  nodeInfoCollection: NodeInfoCollection,
  bakerInfoCollection: BakerInfoCollection,
  rpcUrl: string,
  rpcConfig: RpcClientConfig,
  explorerUrl: string | undefined,
  showSystemInfo: boolean | undefined,
  aliasMap: TzAddressAliasMap,
  tzktConfig: { enabled: boolean; base_url: string },
  configManager: ConfigManager | null = null,
  adminToken: string | undefined = undefined,
) => {
  return {
    nodeInfoCollection,
    bakerInfoCollection,
    rpc: client(rpcUrl, rpcConfig),
    explorerUrl,
    showSystemInfo,
    aliasMap,
    tzkt: createTzktClient(tzktConfig),
    configManager,
    adminToken,
  };
};
```

**Step 2: Update server.ts to pass configManager and adminToken to createContext**

In `backend/src/api/server.ts`, update the `start` function signature and the `createContext` call:

```typescript
// Update imports (add at top)
import type { ConfigManager } from "../configManager";

// Update function signature (line 57)
export const start = (
  nodeMonitor: NodeInfoCollection | null,
  bakerMonitor: BakerInfoCollection | null,
  rpc: URL,
  {
    host,
    port,
    explorer_url,
    webroot: configuredWebroot,
    show_system_info,
    alias: aliasMap,
    admin_token,
  }: UIConfig,
  rpcConfig: RpcClientConfig,
  tzktConfig?: Config["tzkt"],
  configManager?: ConfigManager | null,
) => {
```

And update the `createContext` call (line 86) to pass the new args:

```typescript
  context: createContext(
    nodeMonitor || { info: async () => [] },
    bakerMonitor || {
      info: async () => {
        return {
          bakerInfo: [],
          headDistance: 0,
          blocksPerCycle: 0,
          atRiskThreshold: 1,
        };
      },
    },
    rpc,
    rpcConfig,
    explorer_url,
    show_system_info,
    aliasMap,
    tzktConfig || { enabled: false, base_url: "https://api.tzkt.io" },
    configManager || null,
    admin_token,
  ),
```

**Step 3: Build check**

Run: `cd /home/aurelien/pyrometer/backend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add backend/src/api/context.ts backend/src/api/server.ts
git commit -m "feat: add configManager and adminToken to API context"
```

---

### Task 4: Create GraphQL mutations for auth, bakers, aliases, settings

**Files:**
- Create: `backend/src/api/graphql/Mutations.ts`
- Modify: `backend/src/api/graphql/index.ts` (export new module)

**Step 1: Create Mutations.ts**

Create `backend/src/api/graphql/Mutations.ts`:

```typescript
import {
  extendType,
  objectType,
  stringArg,
  nonNull,
  inputObjectType,
  intArg,
  arg,
} from "nexus";
import {
  validateAddress,
  ValidationResult as TzValidationResult,
} from "@taquito/utils";

const AuthResult = objectType({
  name: "AuthResult",
  definition(t) {
    t.nonNull.boolean("success");
    t.string("message");
  },
});

const MutationResult = objectType({
  name: "MutationResult",
  definition(t) {
    t.nonNull.boolean("success");
    t.string("message");
  },
});

const BakerMonitorSettingsInput = inputObjectType({
  name: "BakerMonitorSettingsInput",
  definition(t) {
    t.string("rpc");
    t.int("max_catchup_blocks");
    t.int("head_distance");
    t.int("missed_threshold");
  },
});

const BakerMonitorSettings = objectType({
  name: "BakerMonitorSettings",
  definition(t) {
    t.nonNull.string("rpc");
    t.nonNull.int("maxCatchupBlocks");
    t.nonNull.int("headDistance");
    t.nonNull.int("missedThreshold");
  },
});

const checkAuth = (
  authHeader: string | undefined,
  adminToken: string | undefined,
): boolean => {
  if (!adminToken) return false;
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === adminToken;
};

export const AdminMutations = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("authenticate", {
      type: AuthResult,
      args: { token: nonNull(stringArg()) },
      resolve(_root, { token }, ctx) {
        if (!ctx.adminToken) {
          return { success: false, message: "Admin access not configured" };
        }
        if (token === ctx.adminToken) {
          return { success: true, message: null };
        }
        return { success: false, message: "Invalid token" };
      },
    });

    t.nonNull.field("addBaker", {
      type: MutationResult,
      args: { address: nonNull(stringArg()) },
      resolve(_root, { address }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        if (validateAddress(address) !== TzValidationResult.VALID) {
          return { success: false, message: "Invalid Tezos address" };
        }
        ctx.configManager.addBaker(address);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("removeBaker", {
      type: MutationResult,
      args: { address: nonNull(stringArg()) },
      resolve(_root, { address }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        ctx.configManager.removeBaker(address);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("setAlias", {
      type: MutationResult,
      args: {
        address: nonNull(stringArg()),
        alias: nonNull(stringArg()),
      },
      resolve(_root, { address, alias }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        ctx.configManager.updateAlias(address, alias);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("removeAlias", {
      type: MutationResult,
      args: { address: nonNull(stringArg()) },
      resolve(_root, { address }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        ctx.configManager.updateAlias(address, null);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("updateBakerMonitorSettings", {
      type: MutationResult,
      args: {
        input: nonNull(arg({ type: BakerMonitorSettingsInput })),
      },
      resolve(_root, { input }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        const updates: Record<string, unknown> = {};
        if (input.rpc != null) updates.rpc = input.rpc;
        if (input.max_catchup_blocks != null) updates.max_catchup_blocks = input.max_catchup_blocks;
        if (input.head_distance != null) updates.head_distance = input.head_distance;
        if (input.missed_threshold != null) updates.missed_threshold = input.missed_threshold;
        ctx.configManager.updateSettings(updates);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("bakerMonitorSettings", {
      type: BakerMonitorSettings,
      resolve(_root, _args, ctx) {
        if (!ctx.configManager) {
          return { rpc: "", maxCatchupBlocks: 0, headDistance: 0, missedThreshold: 0 };
        }
        const s = ctx.configManager.getSettings();
        return {
          rpc: s.rpc,
          maxCatchupBlocks: s.max_catchup_blocks,
          headDistance: s.head_distance,
          missedThreshold: s.missed_threshold,
        };
      },
    });
  },
});

// Also add a query to get the current baker monitor settings
export const AdminQueries = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("bakerMonitorSettings", {
      type: BakerMonitorSettings,
      resolve(_root, _args, ctx) {
        if (!ctx.configManager) {
          return { rpc: "", maxCatchupBlocks: 0, headDistance: 0, missedThreshold: 0 };
        }
        const s = ctx.configManager.getSettings();
        return {
          rpc: s.rpc,
          maxCatchupBlocks: s.max_catchup_blocks,
          headDistance: s.head_distance,
          missedThreshold: s.missed_threshold,
        };
      },
    });

    t.nonNull.boolean("isAdminConfigured", {
      resolve(_root, _args, ctx) {
        return !!ctx.adminToken;
      },
    });

    t.nonNull.list.nonNull.string("configuredBakers", {
      resolve(_root, _args, ctx) {
        if (!ctx.configManager) return [];
        return ctx.configManager.getBakers();
      },
    });
  },
});
```

> **Note:** The auth approach uses `info.rootValue` to get HTTP headers. We need to pass request headers through `rootValue` in server.ts. See Task 5.

**Step 2: Export from index.ts**

Modify `backend/src/api/graphql/index.ts`:

```typescript
export * from "./TezosNode";
export * from "./Baker";
export * from "./SysInfo";
export * from "./Pyrometer";
export * from "./Settings";
export * from "./Mutations";
```

**Step 3: Build check**

Run: `cd /home/aurelien/pyrometer/backend && npx tsc --noEmit`
Expected: May have issues — fix as needed. The `BakerMonitorSettings` query field name conflicts with the mutation field. Remove the duplicate from `AdminMutations` (the `bakerMonitorSettings` field there), keep it only in `AdminQueries`.

**Step 4: Commit**

```bash
git add backend/src/api/graphql/Mutations.ts backend/src/api/graphql/index.ts
git commit -m "feat: add GraphQL mutations for baker/alias/settings management"
```

---

### Task 5: Pass request headers through rootValue for auth

**Files:**
- Modify: `backend/src/api/server.ts:80-106` (graphqlHTTP config)

**Step 1: Update graphqlHTTP to pass headers via rootValue**

The `graphqlHTTP` middleware supports a function for `rootValue` and `context`. Change the `/gql` middleware to pass request info:

In `backend/src/api/server.ts`, replace the graphqlHTTP block (lines 80-106):

```typescript
  app.use(
    "/gql",
    graphqlHTTP((req) => ({
      schema,
      rootValue: { headers: { authorization: req.headers.authorization } },
      graphiql: true,
      context: createContext(
        nodeMonitor || { info: async () => [] },
        bakerMonitor || {
          info: async () => {
            return {
              bakerInfo: [],
              headDistance: 0,
              blocksPerCycle: 0,
              atRiskThreshold: 1,
            };
          },
        },
        rpc,
        rpcConfig,
        explorer_url,
        show_system_info,
        aliasMap,
        tzktConfig || { enabled: false, base_url: "https://api.tzkt.io" },
        configManager || null,
        admin_token,
      ),
    })),
  );
```

**Step 2: Build check**

Run: `cd /home/aurelien/pyrometer/backend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/src/api/server.ts
git commit -m "feat: pass auth headers through graphqlHTTP rootValue"
```

---

### Task 6: Wire ConfigManager into run.ts

**Files:**
- Modify: `backend/src/run.ts` (instantiate ConfigManager, pass to startAPIServer)

**Step 1: Instantiate ConfigManager after config load**

In `backend/src/run.ts`, add imports and create ConfigManager instance.

Add import at top:

```typescript
import { ConfigManager } from "./configManager";
import { join as joinPath } from "path";
```

After line 110 (`const bakerMonitorConfig = config.bakerMonitor;`), and before the tezos client detection block, compute the overrides path and create the ConfigManager. Insert after the `uiConfig` block (around line 205, after bakers and uiConfig are finalized):

```typescript
  // Create ConfigManager for UI-driven config changes
  const configDir = normalizePath(joinPath(storageDir, ".."));
  const overridesPath = joinPath(configDir, "overrides.json");
  const configManager = uiConfig.enabled
    ? new ConfigManager(overridesPath, {
        bakers: bakers,
        aliases: uiConfig.alias || {},
        settings: {
          rpc: bakerMonitorConfig.rpc.url,
          max_catchup_blocks: bakerMonitorConfig.max_catchup_blocks,
          head_distance: bakerMonitorConfig.head_distance,
          missed_threshold: bakerMonitorConfig.missed_threshold,
        },
      })
    : null;
```

Update the `startAPIServer` call (line 229) to pass `configManager`:

```typescript
  const apiServer = uiConfig.enabled
    ? startAPIServer(
        nodeMonitor,
        bakerMonitor,
        bakerMonitorConfig.rpc.url,
        uiConfig,
        config.rpc,
        config.tzkt,
        configManager,
      )
    : null;
```

**Step 2: Build check**

Run: `cd /home/aurelien/pyrometer/backend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/src/run.ts
git commit -m "feat: wire ConfigManager into application startup"
```

---

### Task 7: Regenerate GraphQL schema and codegen

**Step 1: Regenerate backend schema**

Run: `cd /home/aurelien/pyrometer/backend && yarn generate:gql`

This runs Nexus in dev mode and outputs updated `schema.graphql`.

**Step 2: Regenerate frontend types**

Run: `cd /home/aurelien/pyrometer/ui && yarn generate:gql`

This will fail until we add the new queries/mutations to `ui/api.graphql`. We'll do that in the next task.

**Step 3: Commit schema**

```bash
git add backend/src/schema.graphql
git commit -m "chore: regenerate GraphQL schema with mutations"
```

---

### Task 8: Add GraphQL operations for frontend

**Files:**
- Modify: `ui/api.graphql` (add new queries and mutations)

**Step 1: Add new operations to api.graphql**

Append to `ui/api.graphql`:

```graphql
query bakerMonitorSettings {
  bakerMonitorSettings {
    rpc
    maxCatchupBlocks
    headDistance
    missedThreshold
  }
}

query isAdminConfigured {
  isAdminConfigured
}

query configuredBakers {
  configuredBakers
}

mutation authenticate($token: String!) {
  authenticate(token: $token) {
    success
    message
  }
}

mutation addBaker($address: String!) {
  addBaker(address: $address) {
    success
    message
  }
}

mutation removeBaker($address: String!) {
  removeBaker(address: $address) {
    success
    message
  }
}

mutation setAlias($address: String!, $alias: String!) {
  setAlias(address: $address, alias: $alias) {
    success
    message
  }
}

mutation removeAlias($address: String!) {
  removeAlias(address: $address) {
    success
    message
  }
}

mutation updateBakerMonitorSettings($input: BakerMonitorSettingsInput!) {
  updateBakerMonitorSettings(input: $input) {
    success
    message
  }
}
```

**Step 2: Run codegen**

Run: `cd /home/aurelien/pyrometer/ui && yarn generate:gql`
Expected: SUCCESS — generates updated `src/api.ts` with hooks

**Step 3: Commit**

```bash
git add ui/api.graphql ui/src/api.ts
git commit -m "feat: add GraphQL operations and codegen for settings mutations"
```

---

### Task 9: Create AuthContext for frontend

**Files:**
- Create: `ui/src/AuthContext.tsx`

**Step 1: Create auth context with localStorage persistence**

Create `ui/src/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuthenticateMutation } from './api';

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'pyrometer_admin_token';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [authenticate] = useAuthenticateMutation();

  const login = useCallback(async (inputToken: string): Promise<boolean> => {
    try {
      const { data } = await authenticate({ variables: { token: inputToken } });
      if (data?.authenticate.success) {
        setToken(inputToken);
        localStorage.setItem(STORAGE_KEY, inputToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [authenticate]);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Step 2: Update Apollo client to include auth header**

In `ui/src/index.tsx`, modify Apollo client setup to read from localStorage:

```typescript
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({ uri: '/gql/' });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('pyrometer_admin_token');
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

Wrap App with AuthProvider:

```tsx
root.render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ChakraProvider>
    </ApolloProvider>
  </React.StrictMode>,
);
```

**Step 3: Install @apollo/client/link/context if needed**

Run: `cd /home/aurelien/pyrometer/ui && yarn add @apollo/client`

> Note: `setContext` is included in `@apollo/client` — no extra package needed.

**Step 4: Commit**

```bash
git add ui/src/AuthContext.tsx ui/src/index.tsx
git commit -m "feat: add auth context with localStorage token persistence"
```

---

### Task 10: Create Settings page component

**Files:**
- Create: `ui/src/Settings.tsx`

**Step 1: Create Settings component**

Create `ui/src/Settings.tsx`:

```typescript
import React, { useState, useMemo } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Input,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Divider,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { MdDelete, MdEdit, MdLock, MdLockOpen } from 'react-icons/md';
import { useAuth } from './AuthContext';
import {
  useAliasesQuery,
  useConfiguredBakersQuery,
  useBakerMonitorSettingsQuery,
  useIsAdminConfiguredQuery,
  useAddBakerMutation,
  useRemoveBakerMutation,
  useSetAliasMutation,
  useRemoveAliasMutation,
  useUpdateBakerMonitorSettingsMutation,
} from './api';

const isValidTzAddress = (addr: string) =>
  /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(addr) || addr === '*';

export default function Settings() {
  const toast = useToast();
  const { isAuthenticated, login, logout, token } = useAuth();
  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Auth state
  const [authToken, setAuthToken] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Data queries
  const { data: adminData } = useIsAdminConfiguredQuery();
  const { data: bakersData, refetch: refetchBakers } = useConfiguredBakersQuery();
  const { data: aliasesData, refetch: refetchAliases } = useAliasesQuery();
  const { data: settingsData, refetch: refetchSettings } = useBakerMonitorSettingsQuery();

  // Mutations
  const [addBaker] = useAddBakerMutation();
  const [removeBaker] = useRemoveBakerMutation();
  const [setAlias] = useSetAliasMutation();
  const [removeAlias] = useRemoveAliasMutation();
  const [updateSettings] = useUpdateBakerMonitorSettingsMutation();

  // Local form state
  const [newBakerAddress, setNewBakerAddress] = useState('');
  const [newBakerAlias, setNewBakerAlias] = useState('');
  const [editingAlias, setEditingAlias] = useState<{ address: string; alias: string } | null>(null);
  const [deletingBaker, setDeletingBaker] = useState<string | null>(null);

  // Settings form
  const [rpc, setRpc] = useState('');
  const [maxCatchup, setMaxCatchup] = useState('');
  const [headDist, setHeadDist] = useState('');
  const [missedThresh, setMissedThresh] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings form values from query data
  React.useEffect(() => {
    if (settingsData?.bakerMonitorSettings && !settingsLoaded) {
      const s = settingsData.bakerMonitorSettings;
      setRpc(s.rpc);
      setMaxCatchup(String(s.maxCatchupBlocks));
      setHeadDist(String(s.headDistance));
      setMissedThresh(String(s.missedThreshold));
      setSettingsLoaded(true);
    }
  }, [settingsData, settingsLoaded]);

  const aliasMap = useMemo(
    () => new Map(aliasesData?.aliases.map((x) => [x.address, x.alias])),
    [aliasesData],
  );

  const configuredBakers = bakersData?.configuredBakers ?? [];
  const isAdminConfigured = adminData?.isAdminConfigured ?? false;

  // Handlers
  const handleAuth = async () => {
    setAuthLoading(true);
    const success = await login(authToken);
    setAuthLoading(false);
    if (success) {
      toast({ title: 'Authenticated', status: 'success', duration: 2000 });
      onAuthClose();
      setAuthToken('');
    } else {
      toast({ title: 'Invalid token', status: 'error', duration: 2000 });
    }
  };

  const handleAddBaker = async () => {
    if (!isValidTzAddress(newBakerAddress)) {
      toast({ title: 'Invalid address format', status: 'error', duration: 2000 });
      return;
    }
    const { data } = await addBaker({ variables: { address: newBakerAddress } });
    if (data?.addBaker.success) {
      if (newBakerAlias) {
        await setAlias({ variables: { address: newBakerAddress, alias: newBakerAlias } });
      }
      toast({ title: 'Baker added', status: 'success', duration: 2000 });
      setNewBakerAddress('');
      setNewBakerAlias('');
      refetchBakers();
      refetchAliases();
    } else {
      toast({ title: data?.addBaker.message || 'Error', status: 'error', duration: 2000 });
    }
  };

  const handleRemoveBaker = async () => {
    if (!deletingBaker) return;
    const { data } = await removeBaker({ variables: { address: deletingBaker } });
    if (data?.removeBaker.success) {
      toast({ title: 'Baker removed', status: 'success', duration: 2000 });
      refetchBakers();
    } else {
      toast({ title: data?.removeBaker.message || 'Error', status: 'error', duration: 2000 });
    }
    setDeletingBaker(null);
    onDeleteClose();
  };

  const handleSaveAlias = async () => {
    if (!editingAlias) return;
    if (editingAlias.alias) {
      await setAlias({ variables: { address: editingAlias.address, alias: editingAlias.alias } });
    } else {
      await removeAlias({ variables: { address: editingAlias.address } });
    }
    toast({ title: 'Alias updated', status: 'success', duration: 2000 });
    setEditingAlias(null);
    refetchAliases();
  };

  const handleSaveSettings = async () => {
    const { data } = await updateSettings({
      variables: {
        input: {
          rpc: rpc || undefined,
          max_catchup_blocks: maxCatchup ? parseInt(maxCatchup) : undefined,
          head_distance: headDist ? parseInt(headDist) : undefined,
          missed_threshold: missedThresh ? parseInt(missedThresh) : undefined,
        },
      },
    });
    if (data?.updateBakerMonitorSettings.success) {
      toast({ title: 'Settings saved', status: 'success', duration: 2000 });
      refetchSettings();
    } else {
      toast({ title: data?.updateBakerMonitorSettings.message || 'Error', status: 'error', duration: 2000 });
    }
  };

  return (
    <VStack align="stretch" spacing={6} w="100%">
      {/* Auth Section */}
      <HStack justify="space-between">
        <Heading size="md">Settings</Heading>
        {isAdminConfigured && (
          isAuthenticated ? (
            <Button size="sm" leftIcon={<MdLockOpen />} onClick={logout} variant="outline">
              Logout
            </Button>
          ) : (
            <Button size="sm" leftIcon={<MdLock />} onClick={onAuthOpen} colorScheme="blue">
              Unlock
            </Button>
          )
        )}
        {!isAdminConfigured && (
          <Tooltip label="Set admin_token in pyrometer.toml [ui] section to enable editing">
            <Badge colorScheme="gray">Read-only</Badge>
          </Tooltip>
        )}
      </HStack>

      {/* Bakers Section */}
      <Box>
        <Heading size="sm" mb={3}>Monitored Bakers</Heading>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Address</Th>
              <Th>Alias</Th>
              {isAuthenticated && <Th w="100px">Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {configuredBakers.map((address) => (
              <Tr key={address}>
                <Td fontFamily="mono" fontSize="sm">{address}</Td>
                <Td>
                  {editingAlias?.address === address ? (
                    <HStack>
                      <Input
                        size="sm"
                        value={editingAlias.alias}
                        onChange={(e) => setEditingAlias({ ...editingAlias, alias: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
                      />
                      <Button size="sm" onClick={handleSaveAlias}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingAlias(null)}>Cancel</Button>
                    </HStack>
                  ) : (
                    <Text fontSize="sm">{aliasMap.get(address) || '-'}</Text>
                  )}
                </Td>
                {isAuthenticated && (
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        aria-label="Edit alias"
                        icon={<MdEdit />}
                        size="xs"
                        variant="ghost"
                        onClick={() => setEditingAlias({ address, alias: aliasMap.get(address) || '' })}
                      />
                      <IconButton
                        aria-label="Remove baker"
                        icon={<MdDelete />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          setDeletingBaker(address);
                          onDeleteOpen();
                        }}
                      />
                    </HStack>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>

        {isAuthenticated && (
          <HStack mt={3} spacing={2}>
            <FormControl isInvalid={newBakerAddress.length > 0 && !isValidTzAddress(newBakerAddress)} maxW="400px">
              <Input
                size="sm"
                placeholder="tz1... address"
                value={newBakerAddress}
                onChange={(e) => setNewBakerAddress(e.target.value)}
              />
              <FormErrorMessage>Invalid address format</FormErrorMessage>
            </FormControl>
            <Input
              size="sm"
              placeholder="Alias (optional)"
              value={newBakerAlias}
              onChange={(e) => setNewBakerAlias(e.target.value)}
              maxW="200px"
            />
            <Button size="sm" colorScheme="blue" onClick={handleAddBaker} isDisabled={!newBakerAddress}>
              Add
            </Button>
          </HStack>
        )}
      </Box>

      <Divider />

      {/* Monitoring Settings Section */}
      <Box>
        <Heading size="sm" mb={3}>Monitoring Configuration</Heading>
        <VStack align="stretch" spacing={3} maxW="500px">
          <FormControl>
            <FormLabel fontSize="sm">RPC Endpoint</FormLabel>
            <Input
              size="sm"
              value={rpc}
              onChange={(e) => setRpc(e.target.value)}
              isReadOnly={!isAuthenticated}
            />
          </FormControl>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Max Catchup Blocks</FormLabel>
              <Input
                size="sm"
                type="number"
                value={maxCatchup}
                onChange={(e) => setMaxCatchup(e.target.value)}
                isReadOnly={!isAuthenticated}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Head Distance</FormLabel>
              <Input
                size="sm"
                type="number"
                value={headDist}
                onChange={(e) => setHeadDist(e.target.value)}
                isReadOnly={!isAuthenticated}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Missed Threshold</FormLabel>
              <Input
                size="sm"
                type="number"
                value={missedThresh}
                onChange={(e) => setMissedThresh(e.target.value)}
                isReadOnly={!isAuthenticated}
              />
            </FormControl>
          </HStack>
          {isAuthenticated && (
            <Button size="sm" colorScheme="blue" onClick={handleSaveSettings} alignSelf="flex-start">
              Save Settings
            </Button>
          )}
        </VStack>
      </Box>

      {/* Auth Modal */}
      <Modal isOpen={isAuthOpen} onClose={onAuthClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Admin Authentication</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Admin Token</FormLabel>
              <Input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Enter your admin token"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAuthClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleAuth} isLoading={authLoading}>
              Unlock
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Remove Baker</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to stop monitoring <b>{deletingBaker}</b>?</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>Cancel</Button>
            <Button colorScheme="red" onClick={handleRemoveBaker}>Remove</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
```

**Step 2: Commit**

```bash
git add ui/src/Settings.tsx
git commit -m "feat: create Settings page component with baker/alias/config management"
```

---

### Task 11: Add Settings tab to App.tsx

**Files:**
- Modify: `ui/src/App.tsx`

**Step 1: Add Tabs navigation with Settings**

Replace `ui/src/App.tsx`:

```typescript
import {
  VStack,
  HStack,
  IconButton,
  useColorMode,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import React from 'react';
import { MdDarkMode, MdLightMode, MdSettings } from 'react-icons/md';
import SystemInfo from './SystemInfo';
import Bakers from './Bakers';
import Nodes from './Nodes';
import Settings from './Settings';
import { useSettingsQuery } from './api';

interface AppProps {}

function App({}: AppProps) {
  const { data } = useSettingsQuery();
  const { colorMode, toggleColorMode } = useColorMode();

  const [isVisible, setIsVisible] = React.useState(!document.hidden);

  React.useEffect(() => {
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return (
    <VStack p="20px" alignItems="flex-start" w="100%">
      <Tabs w="100%" variant="enclosed" isLazy>
        <HStack w="100%" justifyContent="space-between">
          <TabList>
            <Tab>Bakers</Tab>
            <Tab>Nodes</Tab>
            <Tab><MdSettings style={{ marginRight: 4 }} /> Settings</Tab>
          </TabList>
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'dark' ? <MdLightMode /> : <MdDarkMode />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />
        </HStack>
        <TabPanels>
          <TabPanel px={0}>
            <Bakers isVisible={isVisible} />
            {data?.settings.showSystemInfo && <SystemInfo />}
          </TabPanel>
          <TabPanel px={0}>
            <Nodes isVisible={isVisible} />
          </TabPanel>
          <TabPanel px={0}>
            <Settings />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

export default App;
```

**Step 2: Build check**

Run: `cd /home/aurelien/pyrometer/ui && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add ui/src/App.tsx
git commit -m "feat: add Settings tab to main app navigation"
```

---

### Task 12: Update aliases query to use ConfigManager

**Files:**
- Modify: `backend/src/api/graphql/Baker.ts:360-368`

**Step 1: Update aliases resolver to prefer ConfigManager**

In `backend/src/api/graphql/Baker.ts`, update the aliases query resolver:

```typescript
    t.nonNull.list.nonNull.field("aliases", {
      type: TzAddressAlias,
      async resolve(_root, _args, ctx) {
        const aliasMap = ctx.configManager
          ? ctx.configManager.getAliases()
          : ctx.aliasMap;
        return Object.entries(aliasMap).map(([k, v]) => ({
          address: k,
          alias: v,
        }));
      },
    });
```

**Step 2: Build check**

Run: `cd /home/aurelien/pyrometer/backend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/src/api/graphql/Baker.ts
git commit -m "feat: aliases query uses ConfigManager when available"
```

---

### Task 13: Run all backend tests

**Step 1: Run tests**

Run: `cd /home/aurelien/pyrometer/backend && npx jest --no-coverage`
Expected: All tests pass (existing + new configManager tests)

**Step 2: Fix any issues**

If tests fail, investigate and fix. Common issues:
- Import paths may need adjusting
- Type mismatches between ConfigManager and existing types

**Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix: address test failures from settings feature"
```

---

### Task 14: Build and verify full stack

**Step 1: Build backend**

Run: `cd /home/aurelien/pyrometer/backend && yarn build`
Expected: SUCCESS

**Step 2: Build frontend**

Run: `cd /home/aurelien/pyrometer/ui && yarn build`
Expected: SUCCESS

**Step 3: Manual smoke test**

Run the app locally and verify:
1. The Settings tab appears in the UI
2. Baker list is displayed in Settings
3. Without auth, fields are read-only
4. With `admin_token` configured in TOML and token entered, editing works
5. Adding a baker appears in the list
6. Aliases can be edited inline
7. Settings form loads current values

**Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: full stack build verification for settings feature"
```

---

### Task 15: Lint and format

**Step 1: Format backend**

Run: `cd /home/aurelien/pyrometer/backend && yarn prettier:fix && yarn eslint:fix`

**Step 2: Format frontend**

Run: `cd /home/aurelien/pyrometer/ui && yarn format`

**Step 3: Run full lint check**

Run: `cd /home/aurelien/pyrometer/backend && yarn lint`
Run: `cd /home/aurelien/pyrometer/ui && yarn lint`
Expected: No errors

**Step 4: Commit formatting**

```bash
git add -A
git commit -m "style: format new settings feature files"
```
