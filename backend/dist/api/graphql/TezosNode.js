"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TezosNodeQuery = exports.Nodes = exports.TezosNode = exports.VersionInfo = exports.BlockInfo = void 0;
const nexus_1 = require("nexus");
exports.BlockInfo = (0, nexus_1.objectType)({
    name: "BlockInfo",
    definition(t) {
        t.nonNull.string("protocol");
        t.nonNull.string("hash");
        t.nonNull.int("level");
        t.nonNull.string("timestamp");
        t.int("priority");
        t.int("payload_round");
        t.field("payloadRound", {
            type: "Int",
            async resolve(root, _args, _ctx) {
                if (root.payload_round === undefined) {
                    return null;
                }
                return root.payload_round;
            },
        });
    },
});
exports.VersionInfo = (0, nexus_1.objectType)({
    name: "TezosVersion",
    definition(t) {
        t.nonNull.string("version");
        t.nonNull.string("commitHash");
        t.nonNull.string("chainName");
    },
});
exports.TezosNode = (0, nexus_1.objectType)({
    name: "TezosNode",
    definition(t) {
        t.nonNull.string("url");
        t.nonNull.string("name");
        t.nonNull.list.field("recentBlocks", { type: (0, nexus_1.nonNull)(exports.BlockInfo) });
        t.boolean("bootstrapped");
        t.string("synced");
        t.int("peerCount");
        t.nonNull.field("tezosVersion", { type: (0, nexus_1.nonNull)(exports.VersionInfo) });
        t.string("error");
        t.boolean("unableToReach");
        t.nonNull.string("updatedAt");
    },
});
exports.Nodes = (0, nexus_1.objectType)({
    name: "Nodes",
    definition(t) {
        t.nonNull.field("items", { type: (0, nexus_1.list)((0, nexus_1.nonNull)(exports.TezosNode)) });
        t.nonNull.field("totalCount", {
            type: "Int",
            async resolve(_root, _args, ctx) {
                const info = await ctx.nodeInfoCollection.info();
                return info.length;
            },
        });
    },
});
const fmtVersion = (v) => {
    if (!v)
        return "";
    const { additional_info, major, minor } = v.version;
    const out = `${major}.${minor}`;
    if (!additional_info)
        return out;
    if (additional_info === "dev")
        return out + "-dev";
    if (additional_info === "release")
        return out;
    if (additional_info.rc !== undefined)
        return out + `-rc${additional_info.rc}`;
    return out;
};
const fmtError = (e) => {
    if (!e)
        return "";
    return e.message;
};
exports.TezosNodeQuery = (0, nexus_1.extendType)({
    type: "Query",
    definition(t) {
        t.nonNull.field("nodes", {
            type: exports.Nodes,
            args: {
                offset: (0, nexus_1.nonNull)((0, nexus_1.intArg)()),
                limit: (0, nexus_1.nonNull)((0, nexus_1.intArg)()),
            },
            async resolve(_root, args, ctx) {
                const info = await ctx.nodeInfoCollection.info();
                const nodes = info
                    .slice(args.offset, args.offset + args.limit)
                    .map(({ node, history: recentBlocks, bootstrappedStatus, peerCount, tezosVersion, error, unableToReach, updatedAt, }) => {
                    return {
                        url: node.url,
                        name: node.name,
                        recentBlocks,
                        bootstrapped: bootstrappedStatus?.bootstrapped,
                        synced: bootstrappedStatus?.sync_state,
                        peerCount: peerCount,
                        error: fmtError(error),
                        unableToReach,
                        tezosVersion: {
                            version: fmtVersion(tezosVersion),
                            commitHash: tezosVersion?.commit_info?.commit_hash || "",
                            chainName: tezosVersion?.network_version.chain_name || "",
                        },
                        updatedAt: updatedAt.toISOString(),
                    };
                });
                return { items: nodes };
            },
        });
    },
});
