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
    const getThresholdFor = (baker) => {
        let best = null;
        for (const g of groups.values()) {
            if (g.bakers.has(baker)) {
                if (best === null || g.missed_threshold < best) {
                    best = g.missed_threshold;
                }
            }
        }
        return best ?? fallbackThreshold;
    };
    const getAllMonitoredBakers = () => {
        const set = new Set(staticBakers);
        for (const g of groups.values()) {
            g.bakers.forEach((b) => set.add(b));
        }
        return [...set];
    };
    const setGroupBakers = (name, addrs) => {
        const g = groups.get(name);
        if (!g)
            return;
        g.bakers = new Set(addrs);
    };
    const getMaxThreshold = () => {
        let max = fallbackThreshold;
        for (const g of groups.values()) {
            if (g.missed_threshold > max)
                max = g.missed_threshold;
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
exports.create = create;
