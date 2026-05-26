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
      [{ name: "whales", stake_min: 1_000_000_000_000, missed_threshold: 75 }],
      5,
      [],
    );
    const rpc = mkRpc();
    await refreshOnce(reg, rpc as any, { concurrency: 2 });
    expect(reg.getGroup("whales")!.bakers).toEqual(new Set([A, C]));
  });

  it("keeps previous list and returns false when getActiveBakers fails", async () => {
    const reg = createRegistry(
      [{ name: "whales", stake_min: 1_000_000_000_000, missed_threshold: 75 }],
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
      [{ name: "whales", stake_min: 1_000_000_000_000, missed_threshold: 75 }],
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
      [{ name: "whales", stake_min: 1_000_000_000_000, missed_threshold: 75 }],
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
