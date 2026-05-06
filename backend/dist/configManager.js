"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs"));
const path_1 = require("path");
class ConfigManager extends events_1.EventEmitter {
    constructor(overridesPath, baseline) {
        super();
        this.overridesPath = overridesPath;
        this.baseline = baseline;
        this.overrides = this.loadOverrides();
    }
    loadOverrides() {
        try {
            const raw = fs.readFileSync(this.overridesPath, "utf8");
            return JSON.parse(raw);
        }
        catch {
            return {};
        }
    }
    persist() {
        const dir = (0, path_1.dirname)(this.overridesPath);
        fs.mkdirSync(dir, { recursive: true });
        const tmp = `${this.overridesPath}.${process.pid}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(this.overrides, null, 2), "utf8");
        fs.renameSync(tmp, this.overridesPath);
    }
    getBakers() {
        return this.overrides.baker_monitor?.bakers ?? this.baseline.bakers;
    }
    getAliases() {
        const baseAliases = { ...this.baseline.aliases };
        const overrideAliases = this.overrides.alias ?? {};
        // Apply overrides: null means "delete from baseline"
        for (const [key, val] of Object.entries(overrideAliases)) {
            if (val === null) {
                delete baseAliases[key];
            }
            else {
                baseAliases[key] = val;
            }
        }
        return baseAliases;
    }
    getSettings() {
        const base = this.baseline.settings;
        const over = this.overrides.baker_monitor ?? {};
        return {
            rpc: over.rpc ?? base.rpc,
            max_catchup_blocks: over.max_catchup_blocks ?? base.max_catchup_blocks,
            head_distance: over.head_distance ?? base.head_distance,
            missed_threshold: over.missed_threshold ?? base.missed_threshold,
        };
    }
    addBaker(address) {
        const current = this.getBakers();
        if (current.includes(address))
            return;
        const updated = [...current, address];
        if (!this.overrides.baker_monitor)
            this.overrides.baker_monitor = {};
        this.overrides.baker_monitor.bakers = updated;
        this.persist();
        this.emit("bakers-changed", updated);
    }
    removeBaker(address) {
        const current = this.getBakers();
        const updated = current.filter((b) => b !== address);
        if (!this.overrides.baker_monitor)
            this.overrides.baker_monitor = {};
        this.overrides.baker_monitor.bakers = updated;
        this.persist();
        this.emit("bakers-changed", updated);
    }
    updateAlias(address, alias) {
        if (!this.overrides.alias)
            this.overrides.alias = {};
        if (alias === null) {
            // Store null as a tombstone so getAliases() removes from baseline
            this.overrides.alias[address] = null;
        }
        else {
            this.overrides.alias[address] = alias;
        }
        this.persist();
        this.emit("aliases-changed", this.getAliases());
    }
    updateSettings(partial) {
        if (!this.overrides.baker_monitor)
            this.overrides.baker_monitor = {};
        Object.assign(this.overrides.baker_monitor, partial);
        this.persist();
        this.emit("settings-changed", this.getSettings());
    }
}
exports.ConfigManager = ConfigManager;
