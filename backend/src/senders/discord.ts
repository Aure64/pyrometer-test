import { Event, Events, Sender, FilteredSender, BakersFilter } from "../events";
import format from "../format";
import { chunk } from "lodash";
import type { TzAddressAliasMap } from "../config";
import { getLogger } from "loglevel";

// Node 18+ ships global fetch; declare it so TypeScript can resolve it.
declare const fetch: (url: string, init?: Record<string, unknown>) => Promise<{
  status: number;
  ok: boolean;
  headers: { get: (name: string) => string | null };
}>;

const log = getLogger("discord");

export type DiscordConfig = {
  enabled: boolean;
  url: string;
  emoji: boolean;
  short_address: boolean;
  alias: TzAddressAliasMap;
  exclude: Events[];
  bakers: BakersFilter;
  username?: string;
};

const colorFor = (kind: Events): number => {
  switch (kind) {
    case Events.BakerUnhealthy:
      return 0xe74c3c; // red
    case Events.BakerRecovered:
      return 0x2ecc71; // green
    case Events.MissedBake:
    case Events.MissedEndorsement:
    case Events.MissedBonus:
      return 0xe67e22; // orange
    case Events.DeactivationRisk:
    case Events.Deactivated:
      return 0xc0392b; // dark red
    default:
      return 0x95a5a6; // gray
  }
};

const formatOne = (
  event: Event,
  config: DiscordConfig,
): { title: string; description: string; color: number } => {
  const [line] = format([event], config.emoji, config.short_address, false, config.alias);
  const title = "kind" in event ? String(event.kind) : "event";
  return {
    title,
    description: line ?? title,
    color: colorFor((event as any).kind ?? Events.Notification),
  };
};

const postWithRetry = async (
  url: string,
  body: unknown,
  maxRetries = 3,
): Promise<void> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "1");
      log.warn(`discord 429, waiting ${retryAfter}s`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`discord webhook returned ${res.status}`);
    }
    return;
  }
  throw new Error("discord webhook: max retries exceeded after 429s");
};

export const create = (config: DiscordConfig): Sender => {
  return FilteredSender(async (events: Event[]) => {
    if (events.length === 0) return;
    const embeds = events.map((e) => formatOne(e, config));
    for (const batch of chunk(embeds, 10)) {
      const body: { embeds: typeof batch; username?: string } = { embeds: batch };
      if (config.username) body.username = config.username;
      await postWithRetry(config.url, body);
    }
  }, config);
};
