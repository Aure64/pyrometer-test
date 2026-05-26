import { setLevel } from "loglevel";
import * as path from "path";
import { load } from "./config";

setLevel("SILENT");

const fixturePath = (name: string) =>
  path.join(__dirname, "testFixtures/baker-groups", name);

describe("config: baker_group parsing", () => {
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
    expect(config.bakerGroups[1].stake_min).toEqual("1000000000000");
    expect(config.bakerGroups[1].missed_threshold).toEqual(75);
  });
});
