export type RawBakerGroupConfig = {
  name: string;
  missed_threshold: number;
  // exactly one of:
  bakers?: string[];
  stake_min?: number | string | bigint;
};

export type BakerGroup = {
  name: string;
  missed_threshold: number;
  kind: "static" | "stake";
  stake_min?: bigint;
  bakers: ReadonlySet<string>;
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

  // getMaxThreshold is immutable for the lifetime of the registry; compute once.
  let maxThreshold = fallbackThreshold;
  for (const g of groups.values()) {
    if (g.missed_threshold > maxThreshold) maxThreshold = g.missed_threshold;
  }

  // Hot-path caches invalidated only when setGroupBakers mutates a group.
  // getThresholdFor runs per event, getAllMonitoredBakers runs per block —
  // both stay stable between refreshes, so memoizing avoids per-tick rebuilds.
  const thresholdCache = new Map<string, number>();
  let monitoredCache: string[] | null = null;
  const invalidate = () => {
    thresholdCache.clear();
    monitoredCache = null;
  };

  const getThresholdFor = (baker: string): number => {
    const cached = thresholdCache.get(baker);
    if (cached !== undefined) return cached;
    let best: number | null = null;
    for (const g of groups.values()) {
      if (g.bakers.has(baker)) {
        if (best === null || g.missed_threshold < best) {
          best = g.missed_threshold;
        }
      }
    }
    const resolved = best ?? fallbackThreshold;
    thresholdCache.set(baker, resolved);
    return resolved;
  };

  const getAllMonitoredBakers = (): string[] => {
    if (monitoredCache !== null) return monitoredCache;
    const set = new Set<string>(staticBakers);
    for (const g of groups.values()) {
      g.bakers.forEach((b) => set.add(b));
    }
    monitoredCache = [...set];
    return monitoredCache;
  };

  const setGroupBakers = (name: string, addrs: string[]): void => {
    const g = groups.get(name);
    if (!g) return;
    g.bakers = new Set(addrs);
    invalidate();
  };

  return {
    getGroup: (name) => groups.get(name),
    getThresholdFor,
    getAllMonitoredBakers,
    setGroupBakers,
    getMaxThreshold: () => maxThreshold,
    listGroups: () => [...groups.values()],
  };
};
