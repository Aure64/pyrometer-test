"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTzktClient = void 0;
const loglevel_1 = require("loglevel");
const lru_cache_1 = require("lru-cache");
const util_1 = require("../rpc/util");
const createTzktClient = ({ enabled, base_url }) => {
    const log = (0, loglevel_1.getLogger)("tzkt");
    const cache = new lru_cache_1.LRUCache({ max: 200, ttl: 10 * 60e3 });
    // Rate limiting: track last request time and implement delay
    let lastRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 150; // 150ms between requests (max ~6 req/sec)
    const getOctezVersionForBaker = async (pkh) => {
        if (!enabled)
            return null;
        const key = `octez:${pkh}`;
        const cached = cache.get(key);
        if (cached !== undefined)
            return cached === "" ? null : cached;
        // Rate limiting: wait if needed
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
        }
        lastRequestTime = Date.now();
        try {
            const url = `${base_url}/v1/blocks?proposer=${encodeURIComponent(pkh)}&limit=1&sort.desc=level&select=level,timestamp,software`;
            const t0 = Date.now();
            const res = await (0, util_1.fetchTimeout)(url, 3000);
            const dt = Date.now() - t0;
            log.debug(`|> ${url} in ${dt} ms`);
            if (!res.ok) {
                if (res.status === 429) {
                    log.warn(`TzKT rate limit hit for ${pkh}, caching null for 5 min`);
                    cache.set(key, "", { ttl: 5 * 60e3 }); // Cache for 5 minutes on rate limit
                    return null;
                }
                log.warn(`TzKT API failed for ${pkh}: ${res.status} ${res.statusText}`);
                cache.set(key, "", { ttl: 60e3 });
                return null;
            }
            const json = (await res.json());
            const version = json?.[0]?.software?.version || "";
            log.debug(`TzKT octez version for ${pkh}: ${version || 'none'}`);
            cache.set(key, version);
            return version || null;
        }
        catch (err) {
            log.warn(`TzKT error for ${pkh}:`, err);
            cache.set(key, "", { ttl: 60e3 });
            return null;
        }
    };
    return { getOctezVersionForBaker };
};
exports.createTzktClient = createTzktClient;
