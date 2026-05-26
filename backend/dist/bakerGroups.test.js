"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loglevel_1 = require("loglevel");
const bakerGroups_1 = require("./bakerGroups");
(0, loglevel_1.setLevel)("SILENT");
describe("bakerGroups registry", () => {
    const A = "tz1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const B = "tz1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
    const C = "tz1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
    it("returns the fallback threshold for a baker in no group", () => {
        const reg = (0, bakerGroups_1.create)([], 5, []);
        expect(reg.getThresholdFor(A)).toEqual(5);
    });
    it("returns the group threshold for a baker in one static group", () => {
        const raw = [
            { name: "whales", bakers: [A, B], missed_threshold: 75 },
        ];
        const reg = (0, bakerGroups_1.create)(raw, 5, []);
        expect(reg.getThresholdFor(A)).toEqual(75);
        expect(reg.getThresholdFor(B)).toEqual(75);
        expect(reg.getThresholdFor(C)).toEqual(5);
    });
    it("picks the lowest threshold when a baker is in multiple groups", () => {
        const raw = [
            { name: "corporate", bakers: [A], missed_threshold: 30 },
            { name: "whales", bakers: [A], missed_threshold: 75 },
        ];
        const reg = (0, bakerGroups_1.create)(raw, 5, []);
        expect(reg.getThresholdFor(A)).toEqual(30);
    });
    it("getAllMonitoredBakers returns the union without duplicates", () => {
        const raw = [
            { name: "g1", bakers: [A, B], missed_threshold: 10 },
            { name: "g2", bakers: [B, C], missed_threshold: 20 },
        ];
        const reg = (0, bakerGroups_1.create)(raw, 5, [A]);
        expect(new Set(reg.getAllMonitoredBakers())).toEqual(new Set([A, B, C]));
    });
    it("stake-based groups are empty until setGroupBakers is called", () => {
        const raw = [
            { name: "whales", stake_min: "1000000000000", missed_threshold: 75 },
        ];
        const reg = (0, bakerGroups_1.create)(raw, 5, []);
        expect(reg.getThresholdFor(A)).toEqual(5);
        expect(reg.getAllMonitoredBakers()).toEqual([]);
    });
    it("setGroupBakers updates lookups dynamically", () => {
        const raw = [
            { name: "whales", stake_min: "1000000000000", missed_threshold: 75 },
        ];
        const reg = (0, bakerGroups_1.create)(raw, 5, []);
        reg.setGroupBakers("whales", [A, B]);
        expect(reg.getThresholdFor(A)).toEqual(75);
        expect(reg.getAllMonitoredBakers().sort()).toEqual([A, B].sort());
        reg.setGroupBakers("whales", [C]);
        expect(reg.getThresholdFor(A)).toEqual(5);
        expect(reg.getThresholdFor(C)).toEqual(75);
    });
    it("getMaxThreshold returns the maximum threshold including fallback", () => {
        const raw = [
            { name: "fast", bakers: [A], missed_threshold: 30 },
            { name: "slow", bakers: [B], missed_threshold: 300 },
        ];
        const reg = (0, bakerGroups_1.create)(raw, 5, []);
        expect(reg.getMaxThreshold()).toEqual(300);
    });
    it("getGroup returns the group by name or undefined", () => {
        const raw = [
            { name: "whales", bakers: [A], missed_threshold: 75 },
        ];
        const reg = (0, bakerGroups_1.create)(raw, 5, []);
        expect(reg.getGroup("whales")?.missed_threshold).toEqual(75);
        expect(reg.getGroup("nope")).toBeUndefined();
    });
});
