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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const loglevel_1 = require("loglevel");
const bakerGroups_1 = require("./bakerGroups");
const whalesRefresh_1 = require("./whalesRefresh");
(0, loglevel_1.setLevel)("SILENT");
const A = "tz1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const B = "tz1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const C = "tz1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
const mkRpc = (overrides = {}) => ({
    getActiveBakers: async () => overrides.active ?? [A, B, C],
    getStakingBalance: async (pkh) => {
        if (overrides.failAt?.has(pkh))
            throw new Error("rpc fail");
        return (overrides.stakes ?? { [A]: 2000000000000n, [B]: 500000000000n, [C]: 3000000000000n })[pkh] ?? 0n;
    },
});
describe("whalesRefresh.refreshOnce", () => {
    it("updates the group with bakers above stake_min", async () => {
        const reg = (0, bakerGroups_1.create)([{ name: "whales", stake_min: 1000000000000, missed_threshold: 75 }], 5, []);
        const rpc = mkRpc();
        await (0, whalesRefresh_1.refreshOnce)(reg, rpc, { concurrency: 2 });
        expect(reg.getGroup("whales").bakers).toEqual(new Set([A, C]));
    });
    it("keeps previous list and returns false when getActiveBakers fails", async () => {
        const reg = (0, bakerGroups_1.create)([{ name: "whales", stake_min: 1000000000000, missed_threshold: 75 }], 5, []);
        reg.setGroupBakers("whales", [A]);
        const rpc = {
            getActiveBakers: async () => {
                throw new Error("down");
            },
            getStakingBalance: async () => 0n,
        };
        const result = await (0, whalesRefresh_1.refreshOnce)(reg, rpc, { concurrency: 2 });
        expect(result).toEqual(false);
        expect(reg.getGroup("whales").bakers).toEqual(new Set([A]));
    });
    it("aborts the refresh when >= 50% of stake fetches fail", async () => {
        const reg = (0, bakerGroups_1.create)([{ name: "whales", stake_min: 1000000000000, missed_threshold: 75 }], 5, []);
        reg.setGroupBakers("whales", [A]);
        const rpc = mkRpc({ failAt: new Set([B, C]) });
        const result = await (0, whalesRefresh_1.refreshOnce)(reg, rpc, { concurrency: 2 });
        expect(result).toEqual(false);
        expect(reg.getGroup("whales").bakers).toEqual(new Set([A]));
    });
    it("accepts the refresh when < 50% of stake fetches fail", async () => {
        const reg = (0, bakerGroups_1.create)([{ name: "whales", stake_min: 1000000000000, missed_threshold: 75 }], 5, []);
        const rpc = mkRpc({ failAt: new Set([B]) });
        const result = await (0, whalesRefresh_1.refreshOnce)(reg, rpc, { concurrency: 2 });
        expect(result).toEqual(true);
        expect(reg.getGroup("whales").bakers).toEqual(new Set([A, C]));
    });
});
describe("whalesRefresh cache", () => {
    it("saves and reloads the cache from disk", async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pyro-cache-"));
        const file = path.join(dir, "whales-cache.json");
        await (0, whalesRefresh_1.saveCache)(file, { whales: [A, B] });
        const loaded = await (0, whalesRefresh_1.loadCache)(file);
        expect(loaded).toEqual({ whales: [A, B] });
    });
    it("returns empty object when cache file is missing", async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pyro-cache-"));
        const file = path.join(dir, "nope.json");
        expect(await (0, whalesRefresh_1.loadCache)(file)).toEqual({});
    });
    it("returns empty object when cache file is corrupt", async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pyro-cache-"));
        const file = path.join(dir, "bad.json");
        fs.writeFileSync(file, "{not json");
        expect(await (0, whalesRefresh_1.loadCache)(file)).toEqual({});
    });
});
