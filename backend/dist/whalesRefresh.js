"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.refreshOnce = exports.saveCache = exports.loadCache = void 0;
const fs = __importStar(require("fs/promises"));
const loglevel_1 = require("loglevel");
const log = (0, loglevel_1.getLogger)("whales-refresh");
const loadCache = async (filePath) => {
    try {
        const txt = await fs.readFile(filePath, "utf8");
        const parsed = JSON.parse(txt);
        if (parsed && typeof parsed === "object")
            return parsed;
        return {};
    }
    catch {
        return {};
    }
};
exports.loadCache = loadCache;
const saveCache = async (filePath, cache) => {
    await fs.writeFile(filePath, JSON.stringify(cache, null, 2));
};
exports.saveCache = saveCache;
const mapWithConcurrency = async (items, limit, fn) => {
    const results = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const i = next++;
            if (i >= items.length)
                return;
            try {
                results[i] = { ok: true, value: await fn(items[i]) };
            }
            catch (error) {
                results[i] = { ok: false, error };
            }
        }
    });
    await Promise.all(workers);
    return results;
};
const refreshOnce = async (registry, rpc, opts = {}) => {
    const concurrency = opts.concurrency ?? 10;
    const stakeGroups = registry
        .listGroups()
        .filter((g) => g.kind === "stake" && g.stake_min !== undefined);
    if (stakeGroups.length === 0)
        return true;
    let active;
    try {
        active = await rpc.getActiveBakers();
    }
    catch (err) {
        log.warn("getActiveBakers failed, keeping previous group lists", err);
        return false;
    }
    const stakes = await mapWithConcurrency(active, concurrency, (pkh) => rpc.getStakingBalance(pkh));
    const failures = stakes.filter((s) => !s.ok).length;
    if (failures * 2 >= stakes.length) {
        log.warn(`>=50% staking_balance failures (${failures}/${stakes.length}), aborting refresh`);
        return false;
    }
    for (const g of stakeGroups) {
        const minStake = g.stake_min;
        const matched = [];
        for (let i = 0; i < active.length; i++) {
            const r = stakes[i];
            if (r.ok && r.value >= minStake)
                matched.push(active[i]);
        }
        registry.setGroupBakers(g.name, matched);
        log.info(`Group "${g.name}" refreshed: ${matched.length} bakers`);
    }
    return true;
};
exports.refreshOnce = refreshOnce;
const create = (registry, rpc, cacheFile, refreshIntervalMs, concurrency = 10, 
// Short retry delay used until the first successful refresh (e.g., RPC down
// at boot). After first success we switch to the long refreshIntervalMs.
// service.create only supports a fixed interval, so we hand-roll a scheduler
// here to support variable delays.
retryIntervalMs = 5 * 60 * 1000) => {
    let firstSuccess = false;
    let stopped = false;
    let timer = null;
    const tick = async () => {
        if (stopped)
            return;
        const ok = await (0, exports.refreshOnce)(registry, rpc, { concurrency });
        if (ok) {
            firstSuccess = true;
            const dump = {};
            for (const g of registry.listGroups()) {
                if (g.kind === "stake")
                    dump[g.name] = [...g.bakers];
            }
            try {
                await (0, exports.saveCache)(cacheFile, dump);
            }
            catch (err) {
                log.warn("whales cache save failed", err);
            }
        }
        if (stopped)
            return;
        const nextDelay = firstSuccess ? refreshIntervalMs : retryIntervalMs;
        timer = setTimeout(() => void tick(), nextDelay);
    };
    return {
        name: "whales-refresh",
        start: async () => {
            await tick();
        },
        stop: () => {
            stopped = true;
            if (timer)
                clearTimeout(timer);
        },
    };
};
exports.create = create;
