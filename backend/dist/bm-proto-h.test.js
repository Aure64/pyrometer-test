"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const bm_proto_h_1 = require("./bm-proto-h");
const loglevel_1 = require("loglevel");
const baking_1 = require("./testFixtures/h/baking");
const endorsing_1 = require("./testFixtures/h/endorsing");
(0, loglevel_1.setLevel)("SILENT");
const events_1 = require("./events");
const { delegate } = baking_1.priorityZero;
describe("checkBlockBakingRights", () => {
    it("returns success for baked blocks", () => {
        const result = (0, bm_proto_h_1.checkBlockBakingRights)({
            baker: delegate,
            blockBaker: delegate,
            blockId: "some_block",
            bakingRights: [baking_1.priorityZero],
            blockPriority: 0,
        });
        expect(result).toEqual(events_1.Events.Baked);
    });
    it("returns missed block baked by other baker", () => {
        const rights = [
            {
                level: 1298433,
                delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
                priority: 0,
            },
            {
                level: 1298441,
                delegate: "tz1VHFxUuBhwopxC9YC9gm5s2MHBHLyCtvN1",
                priority: 1,
            },
        ];
        const result = (0, bm_proto_h_1.checkBlockBakingRights)({
            baker: rights[0].delegate,
            blockBaker: rights[1].delegate,
            blockId: "some_block",
            bakingRights: rights,
            blockPriority: 1,
        });
        expect(result).toEqual(events_1.Events.MissedBake);
    });
    it("returns none for a block that our baker has no rights for", () => {
        const result = (0, bm_proto_h_1.checkBlockBakingRights)({
            baker: delegate,
            blockBaker: "other_baker",
            blockId: "some_block",
            bakingRights: [baking_1.priorityZeroOtherBaker],
            blockPriority: 0,
        });
        expect(result).toBe(null);
    });
});
describe("loadBlockRights", () => {
    it("fetches baking and endorsing rights", async () => {
        const getBakingRights = jest.fn().mockResolvedValue({});
        const getEndorsingRights = jest.fn().mockResolvedValue({});
        const rpc = {
            getBakingRights,
            getEndorsingRights,
        };
        await (0, bm_proto_h_1.loadBlockRights)("some_hash", 123, 0, rpc);
        expect(getBakingRights.mock.calls.length).toEqual(1);
        expect(getEndorsingRights.mock.calls.length).toEqual(1);
    });
    it("throws error for failed block data fetch", async () => {
        const getBakingRights = jest.fn().mockResolvedValue({});
        const getEndorsingRights = jest.fn().mockRejectedValue(new Error());
        const rpc = {
            getBakingRights,
            getEndorsingRights,
        };
        const blockId = "some_hash";
        await expect((0, bm_proto_h_1.loadBlockRights)(blockId, 123, 0, rpc)).rejects.toThrow();
    });
});
describe("checkBlockEndorsingRights", () => {
    it("returns success when present in rights and endorsement was made", () => {
        const result = (0, bm_proto_h_1.checkBlockEndorsingRights)({
            baker: endorsing_1.baker,
            endorsementOperations: endorsing_1.endorsementsWithSuccess,
            level: endorsing_1.level,
            endorsingRights: endorsing_1.endorsingRightsResponse,
        });
        expect(result).toEqual([events_1.Events.Endorsed, 1]);
    });
    it("returns missed when present in rights but no endorsement was made", () => {
        const result = (0, bm_proto_h_1.checkBlockEndorsingRights)({
            baker: endorsing_1.baker,
            endorsementOperations: endorsing_1.endorsementsWithMiss,
            level: endorsing_1.level,
            endorsingRights: endorsing_1.endorsingRightsResponse,
        });
        expect(result).toEqual([events_1.Events.MissedEndorsement, 1]);
    });
    it("returns none when not in rights and endorsement was not made", () => {
        const result = (0, bm_proto_h_1.checkBlockEndorsingRights)({
            baker: "another_baker",
            endorsementOperations: endorsing_1.endorsementsWithMiss,
            level: endorsing_1.level + 1,
            endorsingRights: endorsing_1.endorsingRightsResponse,
        });
        expect(result).toBe(null);
    });
    it("returns none when in rights but with different level and endorsement was not made", () => {
        const result = (0, bm_proto_h_1.checkBlockEndorsingRights)({
            baker: endorsing_1.baker,
            endorsementOperations: endorsing_1.endorsementsWithMiss,
            level: 12,
            endorsingRights: endorsing_1.endorsingRightsResponse,
        });
        expect(result).toBe(null);
    });
});
describe("checkBlockAccusationsForDoubleEndorsement", () => {
    it("returns double endorsement when baker is accused", async () => {
        const getBlock = jest.fn().mockResolvedValue({
            hash: "some_hash",
            operations: [endorsing_1.endorsementsWithSuccess],
        });
        const rpc = {
            getBlock,
        };
        const result = await (0, bm_proto_h_1.checkBlockAccusationsForDoubleEndorsement)({
            baker: endorsing_1.baker,
            rpc,
            operations: endorsing_1.operationsWithDoubleEndorsementAccusation,
        });
        expect(result).toEqual(true);
    });
    it("Does not fetch block when there are no accusations", async () => {
        const getBlock = jest.fn();
        const rpc = {
            getBlock,
        };
        const result = await (0, bm_proto_h_1.checkBlockAccusationsForDoubleEndorsement)({
            baker: endorsing_1.baker,
            rpc,
            operations: [],
        });
        expect(result).toEqual(false);
        expect(getBlock.mock.calls.length).toEqual(0);
    });
});
describe("checkBlockAccusationsForDoubleBake", () => {
    it("returns double bake when baker is accused", async () => {
        const getBakingRights = jest
            .fn()
            .mockResolvedValue(baking_1.responseWithPriorityZero);
        const rpc = {
            getBakingRights,
        };
        const result = await (0, bm_proto_h_1.checkBlockAccusationsForDoubleBake)({
            baker: delegate,
            rpc,
            operations: endorsing_1.operationsWithDoubleBakeAccusation,
        });
        expect(result).toEqual(true);
    });
    it("Does not fetch baking rights when there are no accusations", async () => {
        const getBlock = jest.fn();
        const rpc = {
            getBlock,
        };
        const result = await (0, bm_proto_h_1.checkBlockAccusationsForDoubleBake)({
            baker: delegate,
            rpc,
            operations: [],
        });
        expect(result).toEqual(false);
        expect(getBlock.mock.calls.length).toEqual(0);
    });
});
