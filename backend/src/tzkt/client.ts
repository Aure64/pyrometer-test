import { getLogger } from "loglevel";
import { LRUCache } from "lru-cache";
import fetch from "node-fetch";

export type TzktConfig = { enabled: boolean; base_url: string };

export type TzktClient = {
  getOctezVersionForBaker: (pkh: string) => Promise<string | null>;
};

export const createTzktClient = ({ enabled, base_url }: TzktConfig): TzktClient => {
  const log = getLogger("tzkt");
  const cache = new LRUCache<string, string>({ max: 200, ttl: 10 * 60e3 });

  const getOctezVersionForBaker = async (pkh: string): Promise<string | null> => {
    if (!enabled) return null;
    const key = `octez:${pkh}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached === "" ? null : cached;

    try {
      const url = `${base_url}/v1/blocks?proposer=${encodeURIComponent(
        pkh,
      )}&limit=1&sort.desc=level&select=level,timestamp,software`;
      const t0 = Date.now();
      const res = await fetch(url, { timeout: 3000 });
      const dt = Date.now() - t0;
      log.debug(`|> ${url} in ${dt} ms`);
      if (!res.ok) {
        cache.set(key, "", { ttl: 60e3 });
        return null;
      }
      const json = (await res.json()) as Array<{
        software?: { version?: string } | null;
      }>;
      const version = json?.[0]?.software?.version || "";
      cache.set(key, version);
      return version || null;
    } catch (err) {
      log.debug("tzkt error", err);
      cache.set(key, "", { ttl: 60e3 });
      return null;
    }
  };

  return { getOctezVersionForBaker };
};


