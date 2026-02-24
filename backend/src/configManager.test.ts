import { ConfigManager } from "./configManager";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("ConfigManager", () => {
  let tmpDir: string;
  let overridesPath: string;

  const makeBaseline = (overrides: Record<string, unknown> = {}) => ({
    bakers: ["tz1abc"],
    aliases: { tz1abc: "Baker A" },
    settings: {
      rpc: "https://rpc.example.com",
      max_catchup_blocks: 120,
      head_distance: 1,
      missed_threshold: 3,
    },
    ...overrides,
  });

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pyrometer-test-"));
    overridesPath = path.join(tmpDir, "overrides.json");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("initialization", () => {
    it("returns baseline config when no overrides file exists", () => {
      const cm = new ConfigManager(overridesPath, makeBaseline());
      expect(cm.getBakers()).toEqual(["tz1abc"]);
      expect(cm.getAliases()).toEqual({ tz1abc: "Baker A" });
    });

    it("merges overrides on top of baseline", () => {
      fs.writeFileSync(
        overridesPath,
        JSON.stringify({
          baker_monitor: { bakers: ["tz1xyz"] },
          alias: { tz1xyz: "Baker X" },
        }),
      );
      const cm = new ConfigManager(overridesPath, makeBaseline());
      expect(cm.getBakers()).toEqual(["tz1xyz"]);
      expect(cm.getAliases()).toEqual({ tz1abc: "Baker A", tz1xyz: "Baker X" });
    });
  });

  describe("addBaker", () => {
    it("adds a baker and persists to overrides file", () => {
      const cm = new ConfigManager(overridesPath, makeBaseline());
      cm.addBaker("tz1new");
      expect(cm.getBakers()).toContain("tz1new");
      const saved = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
      expect(saved.baker_monitor.bakers).toContain("tz1new");
    });

    it("emits bakers-changed event", () => {
      const cm = new ConfigManager(
        overridesPath,
        makeBaseline({ bakers: [] }),
      );
      const handler = jest.fn();
      cm.on("bakers-changed", handler);
      cm.addBaker("tz1new");
      expect(handler).toHaveBeenCalledWith(["tz1new"]);
    });

    it("does not add duplicate baker", () => {
      const cm = new ConfigManager(overridesPath, makeBaseline());
      cm.addBaker("tz1abc");
      expect(cm.getBakers()).toEqual(["tz1abc"]);
    });
  });

  describe("removeBaker", () => {
    it("removes a baker and persists", () => {
      const cm = new ConfigManager(
        overridesPath,
        makeBaseline({ bakers: ["tz1abc", "tz1def"] }),
      );
      cm.removeBaker("tz1abc");
      expect(cm.getBakers()).toEqual(["tz1def"]);
    });

    it("emits bakers-changed event", () => {
      const cm = new ConfigManager(overridesPath, makeBaseline());
      const handler = jest.fn();
      cm.on("bakers-changed", handler);
      cm.removeBaker("tz1abc");
      expect(handler).toHaveBeenCalledWith([]);
    });
  });

  describe("updateAlias", () => {
    it("sets an alias and persists", () => {
      const cm = new ConfigManager(
        overridesPath,
        makeBaseline({ aliases: {} }),
      );
      cm.updateAlias("tz1abc", "My Baker");
      expect(cm.getAliases()).toEqual({ tz1abc: "My Baker" });
    });

    it("removes an alias when value is null", () => {
      const cm = new ConfigManager(overridesPath, makeBaseline());
      cm.updateAlias("tz1abc", null);
      expect(cm.getAliases()).toEqual({});
    });

    it("emits aliases-changed event", () => {
      const cm = new ConfigManager(
        overridesPath,
        makeBaseline({ aliases: {} }),
      );
      const handler = jest.fn();
      cm.on("aliases-changed", handler);
      cm.updateAlias("tz1abc", "Alias");
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("updateSettings", () => {
    it("partially updates settings and persists", () => {
      const cm = new ConfigManager(overridesPath, makeBaseline());
      cm.updateSettings({ max_catchup_blocks: 200 });
      expect(cm.getSettings().max_catchup_blocks).toBe(200);
      expect(cm.getSettings().head_distance).toBe(1);
    });

    it("emits settings-changed event", () => {
      const cm = new ConfigManager(overridesPath, makeBaseline());
      const handler = jest.fn();
      cm.on("settings-changed", handler);
      cm.updateSettings({ max_catchup_blocks: 200 });
      expect(handler).toHaveBeenCalled();
    });
  });
});
