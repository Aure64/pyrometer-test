"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loglevel_1 = require("loglevel");
const bakerGroups_1 = require("./bakerGroups");
const senderBakersResolver_1 = require("./senderBakersResolver");
(0, loglevel_1.setLevel)("SILENT");
const A = "tz1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const B = "tz1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
const C = "tz1CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC";
describe("resolveSenderBakers", () => {
    it("returns undefined when input is undefined", () => {
        const reg = (0, bakerGroups_1.create)([], 5, []);
        expect((0, senderBakersResolver_1.resolveSenderBakers)(undefined, reg)).toBeUndefined();
    });
    it("returns a string[] unchanged when no @group: ref is present", () => {
        const reg = (0, bakerGroups_1.create)([], 5, []);
        expect((0, senderBakersResolver_1.resolveSenderBakers)([A, B], reg)).toEqual([A, B]);
    });
    it("returns a callback when at least one @group: ref is present", () => {
        const reg = (0, bakerGroups_1.create)([{ name: "whales", bakers: [A, B], missed_threshold: 75 }], 5, []);
        const r = (0, senderBakersResolver_1.resolveSenderBakers)(["@group:whales", C], reg);
        expect(typeof r).toEqual("function");
        expect(r().sort()).toEqual([A, B, C].sort());
    });
    it("callback reflects live changes to the group", () => {
        const reg = (0, bakerGroups_1.create)([{ name: "whales", stake_min: 1000000000000, missed_threshold: 75 }], 5, []);
        const r = (0, senderBakersResolver_1.resolveSenderBakers)(["@group:whales"], reg);
        expect(r()).toEqual([]);
        reg.setGroupBakers("whales", [A, B]);
        expect(r().sort()).toEqual([A, B].sort());
    });
    it("throws for an unknown @group: reference", () => {
        const reg = (0, bakerGroups_1.create)([], 5, []);
        expect(() => (0, senderBakersResolver_1.resolveSenderBakers)(["@group:nope"], reg)).toThrow(/unknown group "nope"/);
    });
});
