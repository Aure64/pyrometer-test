import { setLevel } from "loglevel";
import { Events, Baked, BakerUnhealthy } from "../events";
import { create, DiscordConfig } from "./discord";

setLevel("SILENT");

const mkBaked = (): Baked => ({
  kind: Events.Baked,
  createdAt: new Date("2026-05-26T08:00:00Z"),
  baker: "tz1AAAAAAAAAA",
  cycle: 1,
  level: 1,
  priority: 0,
  timestamp: new Date("2026-05-26T08:00:00Z"),
});

const mkUnhealthy = (): BakerUnhealthy => ({
  kind: Events.BakerUnhealthy,
  baker: "tz1AAAAAAAAAA",
  cycle: 1,
  level: 1,
  createdAt: new Date("2026-05-26T08:00:00Z"),
  timestamp: new Date("2026-05-26T08:00:00Z"),
});

const mkConfig = (overrides: Partial<DiscordConfig> = {}): DiscordConfig => ({
  enabled: true,
  url: "https://discord.example/webhook",
  emoji: true,
  short_address: true,
  alias: {},
  exclude: [],
  bakers: undefined,
  ...overrides,
});

describe("discord sender", () => {
  let postedBodies: any[] = [];
  let nextResponses: Array<{ status: number; headers?: Record<string, string> }> = [];

  beforeEach(() => {
    postedBodies = [];
    nextResponses = [];
    (global as any).fetch = jest.fn(async (_url: string, init: any) => {
      postedBodies.push(JSON.parse(init.body));
      const r = nextResponses.shift() ?? { status: 204 };
      return {
        status: r.status,
        ok: r.status < 400,
        headers: { get: (k: string) => r.headers?.[k.toLowerCase()] ?? null },
      };
    });
  });

  it("posts one POST per <=10 embeds", async () => {
    const events = Array.from({ length: 12 }, mkBaked);
    const sender = create(mkConfig());
    await sender(events);
    expect(postedBodies.length).toEqual(2);
    expect(postedBodies[0].embeds.length).toEqual(10);
    expect(postedBodies[1].embeds.length).toEqual(2);
  });

  it("colors BakerUnhealthy red, Baked gray", async () => {
    const sender = create(mkConfig());
    await sender([mkBaked(), mkUnhealthy()]);
    const colors = postedBodies[0].embeds.map((e: any) => e.color);
    expect(colors).toEqual([0x95a5a6, 0xe74c3c]);
  });

  it("filters by exclude (event kind)", async () => {
    const sender = create(mkConfig({ exclude: [Events.Baked] }));
    await sender([mkBaked(), mkUnhealthy()]);
    expect(postedBodies[0].embeds.length).toEqual(1);
  });

  it("filters by bakers callback (dynamic)", async () => {
    let allow = new Set(["tz1AAAAAAAAAA"]);
    const sender = create(mkConfig({ bakers: () => [...allow] }));
    await sender([mkBaked()]);
    expect(postedBodies.length).toEqual(1);
    postedBodies = [];
    allow = new Set(["tz1ZZZ"]);
    await sender([mkBaked()]);
    expect(postedBodies.length).toEqual(0);
  });

  it("respects Retry-After on HTTP 429", async () => {
    jest.useFakeTimers();
    nextResponses = [
      { status: 429, headers: { "retry-after": "0" } },
      { status: 204 },
    ];
    const sender = create(mkConfig());
    const p = sender([mkBaked()]);
    await jest.runAllTimersAsync();
    await p;
    expect(postedBodies.length).toEqual(2);
    jest.useRealTimers();
  });
});
