import { EventEmitter } from "events";
import * as fs from "fs";
import { dirname } from "path";
import type { TzAddressAliasMap } from "./config";

type OverrideAliasMap = { [key: string]: string | null };

type OverridesData = {
  baker_monitor?: {
    bakers?: string[];
    rpc?: string;
    max_catchup_blocks?: number;
    head_distance?: number;
    missed_threshold?: number;
  };
  alias?: OverrideAliasMap;
};

export type MonitorSettings = {
  rpc: string;
  max_catchup_blocks: number;
  head_distance: number;
  missed_threshold: number;
};

type Baseline = {
  bakers: string[];
  aliases: TzAddressAliasMap;
  settings: MonitorSettings;
};

export class ConfigManager extends EventEmitter {
  private overridesPath: string;
  private baseline: Baseline;
  private overrides: OverridesData;

  constructor(overridesPath: string, baseline: Baseline) {
    super();
    this.overridesPath = overridesPath;
    this.baseline = baseline;
    this.overrides = this.loadOverrides();
  }

  private loadOverrides(): OverridesData {
    try {
      const raw = fs.readFileSync(this.overridesPath, "utf8");
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private persist(): void {
    const dir = dirname(this.overridesPath);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = `${this.overridesPath}.${process.pid}.tmp`;
    fs.writeFileSync(
      tmp,
      JSON.stringify(this.overrides, null, 2),
      "utf8",
    );
    fs.renameSync(tmp, this.overridesPath);
  }

  getBakers(): string[] {
    return this.overrides.baker_monitor?.bakers ?? this.baseline.bakers;
  }

  getAliases(): TzAddressAliasMap {
    const baseAliases = { ...this.baseline.aliases };
    const overrideAliases = this.overrides.alias ?? {};
    // Apply overrides: null means "delete from baseline"
    for (const [key, val] of Object.entries(overrideAliases)) {
      if (val === null) {
        delete baseAliases[key];
      } else {
        baseAliases[key] = val;
      }
    }
    return baseAliases;
  }

  getSettings(): MonitorSettings {
    const base = this.baseline.settings;
    const over = this.overrides.baker_monitor ?? {};
    return {
      rpc: over.rpc ?? base.rpc,
      max_catchup_blocks: over.max_catchup_blocks ?? base.max_catchup_blocks,
      head_distance: over.head_distance ?? base.head_distance,
      missed_threshold: over.missed_threshold ?? base.missed_threshold,
    };
  }

  addBaker(address: string): void {
    const current = this.getBakers();
    if (current.includes(address)) return;
    const updated = [...current, address];
    if (!this.overrides.baker_monitor) this.overrides.baker_monitor = {};
    this.overrides.baker_monitor.bakers = updated;
    this.persist();
    this.emit("bakers-changed", updated);
  }

  removeBaker(address: string): void {
    const current = this.getBakers();
    const updated = current.filter((b) => b !== address);
    if (!this.overrides.baker_monitor) this.overrides.baker_monitor = {};
    this.overrides.baker_monitor.bakers = updated;
    this.persist();
    this.emit("bakers-changed", updated);
  }

  updateAlias(address: string, alias: string | null): void {
    if (!this.overrides.alias) this.overrides.alias = {};
    if (alias === null) {
      // Store null as a tombstone so getAliases() removes from baseline
      this.overrides.alias[address] = null;
    } else {
      this.overrides.alias[address] = alias;
    }
    this.persist();
    this.emit("aliases-changed", this.getAliases());
  }

  updateSettings(partial: Partial<MonitorSettings>): void {
    if (!this.overrides.baker_monitor) this.overrides.baker_monitor = {};
    Object.assign(this.overrides.baker_monitor, partial);
    this.persist();
    this.emit("settings-changed", this.getSettings());
  }
}
