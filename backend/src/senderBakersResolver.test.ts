import { setLevel } from "loglevel";
import { create as createRegistry } from "./bakerGroups";
import { resolveSenderBakers } from "./senderBakersResolver";

setLevel("SILENT");

const A = "tz1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const B = "tz1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const C = "tz1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";

describe("resolveSenderBakers", () => {
  it("returns undefined when input is undefined", () => {
    const reg = createRegistry([], 5, []);
    expect(resolveSenderBakers(undefined, reg)).toBeUndefined();
  });

  it("returns a string[] unchanged when no @group: ref is present", () => {
    const reg = createRegistry([], 5, []);
    expect(resolveSenderBakers([A, B], reg)).toEqual([A, B]);
  });

  it("returns a callback when at least one @group: ref is present", () => {
    const reg = createRegistry(
      [{ name: "whales", bakers: [A, B], missed_threshold: 75 }],
      5,
      [],
    );
    const r = resolveSenderBakers(["@group:whales", C], reg);
    expect(typeof r).toEqual("function");
    expect((r as () => string[])().sort()).toEqual([A, B, C].sort());
  });

  it("callback reflects live changes to the group", () => {
    const reg = createRegistry(
      [{ name: "whales", stake_min: 1_000_000_000_000, missed_threshold: 75 }],
      5,
      [],
    );
    const r = resolveSenderBakers(["@group:whales"], reg) as () => string[];
    expect(r()).toEqual([]);
    reg.setGroupBakers("whales", [A, B]);
    expect(r().sort()).toEqual([A, B].sort());
  });

  it("throws for an unknown @group: reference", () => {
    const reg = createRegistry([], 5, []);
    expect(() => resolveSenderBakers(["@group:nope"], reg)).toThrow(
      /unknown group "nope"/,
    );
  });
});
