"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const create = (raw, fallbackThreshold, staticBakers) => {
    const groups = new Map();
    for (const g of raw) {
        const kind = g.stake_min !== undefined ? "stake" : "static";
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
        if (g.missed_threshold > maxThreshold)
            maxThreshold = g.missed_threshold;
    }
    // Hot-path caches invalidated only when setGroupBakers mutates a group.
    // getThresholdFor runs per event, getAllMonitoredBakers runs per block —
    // both stay stable between refreshes, so memoizing avoids per-tick rebuilds.
    const thresholdCache = new Map();
    let monitoredCache = null;
    const invalidate = () => {
        thresholdCache.clear();
        monitoredCache = null;
    };
    const getThresholdFor = (baker) => {
        const cached = thresholdCache.get(baker);
        if (cached !== undefined)
            return cached;
        let best = null;
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
    const getAllMonitoredBakers = () => {
        if (monitoredCache !== null)
            return monitoredCache;
        const set = new Set(staticBakers);
        for (const g of groups.values()) {
            g.bakers.forEach((b) => set.add(b));
        }
        monitoredCache = [...set];
        return monitoredCache;
    };
    const setGroupBakers = (name, addrs) => {
        const g = groups.get(name);
        if (!g)
            return;
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
exports.create = create;
