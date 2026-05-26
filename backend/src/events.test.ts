import {
  Events,
  Event,
  Notification,
  Baked,
  NodeSynced,
  FilteredSender,
  MissedEndorsement,
  Sender,
} from "./events";

describe("filtered sender", () => {
  const event1: Notification = {
    kind: Events.Notification,
    createdAt: new Date(),
    message: "hi",
  };

  const event2: Baked = {
    kind: Events.Baked,
    createdAt: new Date(),
    baker: "tz123",
    cycle: 1,
    level: 1,
    priority: 0,
    timestamp: new Date(),
  };

  const event3: Baked = {
    kind: Events.Baked,
    createdAt: new Date(),
    baker: "tz345",
    cycle: 2,
    level: 2,
    priority: 0,
    timestamp: new Date(),
  };

  const event4: NodeSynced = {
    kind: Events.NodeSynced,
    createdAt: new Date(),
    node: "http://localhost:8732",
  };

  const event5: MissedEndorsement = {
    kind: Events.MissedEndorsement,
    createdAt: new Date(),
    baker: "tz345",
    cycle: 2,
    level: 2,
    slotCount: 10,
    timestamp: new Date(),
  };

  it("sends all when no exclude", async () => {
    const toSend = [event1, event2, event3, event4];
    let sent: Event[] = [];

    const sender = FilteredSender(
      async (inEvents: Event[]) => {
        sent = inEvents;
      },
      {
        exclude: [],
        bakers: undefined,
      },
    );

    await sender(toSend);

    expect(sent).toEqual(toSend);
  });

  it("filters excluded event kinds", async () => {
    const toSend = [event1, event2, event3, event4];
    let sent: Event[] = [];

    const sender = FilteredSender(
      async (inEvents: Event[]) => {
        sent = inEvents;
      },
      {
        exclude: [Events.Baked],
        bakers: undefined,
      },
    );

    await sender(toSend);

    expect(sent).toEqual([event1, event4]);
  });

  it("sends nothing when all kinds are excluded", async () => {
    const toSend = [event1, event2, event3, event4];
    let sent: Event[] = [];

    const sender = FilteredSender(
      async (inEvents: Event[]) => {
        sent = inEvents;
      },
      {
        exclude: Object.values(Events),
        bakers: undefined,
      },
    );

    await sender(toSend);

    expect(sent).toEqual([]);
  });

  it("sends only events for specified bakers ", async () => {
    const toSend = [event5, event1, event2, event3, event4];
    let sent: Event[] = [];

    const sender = FilteredSender(
      async (inEvents: Event[]) => {
        sent = inEvents;
      },
      {
        exclude: [],
        bakers: ["tz345"],
      },
    );

    await sender(toSend);

    expect(sent).toEqual([event5, event1, event3, event4]);
  });
});

describe("filtered sender with bakers callback", () => {
  const baked = (baker: string): Baked => ({
    kind: Events.Baked,
    createdAt: new Date(),
    baker,
    cycle: 1,
    level: 1,
    priority: 0,
    timestamp: new Date(),
  });

  it("invokes the bakers callback per batch and filters dynamically", async () => {
    let allow = new Set(["tz1A"]);
    const seen: Event[][] = [];
    const inner: Sender = async (events) => {
      seen.push(events);
    };
    const sender = FilteredSender(inner, {
      exclude: [],
      bakers: () => [...allow],
    });

    await sender([baked("tz1A"), baked("tz1B")]);
    expect(seen[0].map((e) => (e as Baked).baker)).toEqual(["tz1A"]);

    allow = new Set(["tz1B"]);
    await sender([baked("tz1A"), baked("tz1B")]);
    expect(seen[1].map((e) => (e as Baked).baker)).toEqual(["tz1B"]);
  });

  it("still accepts a static string[] for backward compat", async () => {
    const seen: Event[][] = [];
    const inner: Sender = async (events) => {
      seen.push(events);
    };
    const sender = FilteredSender(inner, {
      exclude: [],
      bakers: ["tz1A"],
    });
    await sender([baked("tz1A"), baked("tz1B")]);
    expect(seen[0].map((e) => (e as Baked).baker)).toEqual(["tz1A"]);
  });
});
