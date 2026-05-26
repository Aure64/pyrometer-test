import { setLevel } from "loglevel";
import nconf from "nconf";
import * as path from "path";
import { load, validateBakerGroups } from "./config";

setLevel("SILENT");

const fixturePath = (name: string) =>
  path.join(__dirname, "testFixtures/baker-groups", name);

describe("config: baker_group parsing", () => {
  const originalArgv = process.argv;
  afterEach(() => {
    process.argv = originalArgv;
    // reset nconf stores so the next test gets a clean instance
    nconf.remove("argv");
    nconf.remove("file");
    nconf.remove("defaults");
    nconf.remove("overrides");
  });

  it("parses [[baker_group]] into the Config", async () => {
    process.argv = [process.argv[0], process.argv[1], "--config", fixturePath("valid.toml")];
    const config = await load(undefined, false);
    expect(config.bakerGroups).toBeDefined();
    expect(config.bakerGroups.length).toEqual(2);
    expect(config.bakerGroups[0].name).toEqual("corporate");
    expect(config.bakerGroups[0].bakers).toEqual([
      "tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26",
    ]);
    expect(config.bakerGroups[0].missed_threshold).toEqual(30);
    expect(config.bakerGroups[1].name).toEqual("whales");
    expect(config.bakerGroups[1].stake_min).toEqual(1_000_000_000_000);
    expect(config.bakerGroups[1].missed_threshold).toEqual(75);
  });
});

describe("config: baker_group validation", () => {
  it("rejects a group without a name", () => {
    expect(() =>
      validateBakerGroups([
        { bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 } as any,
      ]),
    ).toThrow(/'name' is required/);
  });

  it("rejects duplicate names", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 },
        { name: "g", bakers: ["tz1XJqNybPz88X84kGPLN5LFaC4oN1av75dA"], missed_threshold: 30 },
      ]),
    ).toThrow(/duplicate name "g"/);
  });

  it("rejects a group with neither bakers nor stake_min", () => {
    expect(() =>
      validateBakerGroups([{ name: "g", missed_threshold: 30 } as any]),
    ).toThrow(/must define either 'bakers' or 'stake_min'/);
  });

  it("rejects a group with both bakers and stake_min", () => {
    expect(() =>
      validateBakerGroups([
        {
          name: "g",
          bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"],
          stake_min: 1_000_000_000_000,
          missed_threshold: 30,
        },
      ]),
    ).toThrow(/'bakers' and 'stake_min' are mutually exclusive/);
  });

  it("rejects missed_threshold <= 0", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 0 },
      ]),
    ).toThrow(/'missed_threshold' must be > 0/);
  });

  it("rejects names not matching [a-z][a-z0-9_-]*", () => {
    expect(() =>
      validateBakerGroups([
        { name: "BadName!", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 },
      ]),
    ).toThrow(/name must match/);
  });

  it("rejects invalid tz addresses inside bakers", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", bakers: ["not-a-tz-address"], missed_threshold: 30 },
      ]),
    ).toThrow(/invalid address/);
  });

  it("rejects stake_min <= 0", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g", stake_min: 0, missed_threshold: 30 },
      ]),
    ).toThrow(/'stake_min' must be > 0/);
  });

  it("accepts a valid set", () => {
    expect(() =>
      validateBakerGroups([
        { name: "g1", bakers: ["tz1gcna2xxZj2eNp1LaMyAhVJ49mEFj4FH26"], missed_threshold: 30 },
        { name: "g2", stake_min: 1_000_000_000_000, missed_threshold: 75 },
      ]),
    ).not.toThrow();
  });
});
