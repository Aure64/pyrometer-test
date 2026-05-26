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
