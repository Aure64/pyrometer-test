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
    // eslint-disable-next-line no-constant-condition
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
  let firstRun = true;

  const task = async (_isInterrupted: () => boolean) => {
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
