"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BakerQuery = exports.TzAddressAlias = exports.Bakers = exports.Baker = exports.ConsensusKey = exports.PendingConsensusKey = exports.Participation = exports.LastProcessed = exports.NetworkInfo = exports.LevelEvents = exports.BakerEvent = void 0;
const lodash_1 = require("lodash");
const nexus_1 = require("nexus");
const lru_cache_1 = require("lru-cache");
const graphql_1 = require("graphql");
const mkExplorerUrl = (ctx, thing) => ctx.explorerUrl ? `${ctx.explorerUrl}/${thing}` : null;
exports.BakerEvent = (0, nexus_1.objectType)({
    name: "BakerEvent",
    definition(t) {
        t.nonNull.string("kind");
        t.int("priority");
        t.int("slotCount");
    },
});
exports.LevelEvents = (0, nexus_1.objectType)({
    name: "LevelEvents",
    definition(t) {
        t.nonNull.int("level");
        t.string("explorerUrl");
        t.nonNull.int("cycle");
        t.nonNull.string("timestamp");
        t.nonNull.list.field("events", { type: (0, nexus_1.nonNull)(exports.BakerEvent) });
    },
});
exports.NetworkInfo = (0, nexus_1.objectType)({
    name: "NetworkInfo",
    definition(t) {
        t.nonNull.field("chainName", {
            type: (0, nexus_1.nonNull)("String"),
            async resolve(_parent, _args, ctx) {
                const tzVersion = await ctx.rpc.getTezosVersion();
                return tzVersion.network_version.chain_name;
            },
        });
        t.nonNull.int("level");
        t.nonNull.int("cycle");
        t.nonNull.string("protocol");
        t.nonNull.int("cyclePosition");
        t.nonNull.int("blocksPerCycle");
    },
});
exports.LastProcessed = (0, nexus_1.objectType)({
    name: "LastProcessed",
    definition(t) {
        t.nonNull.int("level");
        t.nonNull.int("cycle");
        t.nonNull.int("cyclePosition");
    },
});
exports.Participation = (0, nexus_1.objectType)({
    name: "Participation",
    definition(t) {
        t.nonNull.int("expected_cycle_activity");
        t.nonNull.int("minimal_cycle_activity");
        t.nonNull.int("missed_slots");
        t.nonNull.int("missed_levels");
        t.nonNull.int("remaining_allowed_missed_slots");
        t.nonNull.string("expected_endorsing_rewards");
    },
});
exports.PendingConsensusKey = (0, nexus_1.objectType)({
    name: "PendingConsensusKey",
    definition(t) {
        t.nonNull.string("pkh");
        t.nonNull.int("cycle");
    },
});
exports.ConsensusKey = (0, nexus_1.objectType)({
    name: "ConsensusKey",
    definition(t) {
        t.nonNull.string("active");
        t.string("explorerUrl");
        t.list.field("pendings", { type: (0, nexus_1.nonNull)(exports.PendingConsensusKey) });
    },
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bakerCache = new lru_cache_1.LRUCache({ max: 100 });
const mkGQLError = (originalError) => {
    return new graphql_1.GraphQLError(originalError.message, {
        extensions: { code: "TEZOS_RPC_ERROR", error: originalError },
    });
};
const getGracePeriod = async (rpc, cycle, level, address, atRiskThreshold) => {
    const cacheKey = `${cycle}:${address}:gracePeriod`;
    let value = bakerCache.get(cacheKey);
    if (!value) {
        try {
            value = await rpc.getGracePeriod(address, `${level}`);
            const atRisk = value - cycle <= atRiskThreshold;
            //baker's grace period end is updated at first endorsement
            //so "at risk" bakers may stop being at risk during the cycle
            //so shouldn't be cached
            if (!atRisk) {
                bakerCache.set(cacheKey, value);
            }
        }
        catch (err) {
            throw mkGQLError(err);
        }
    }
    return value;
};
exports.Baker = (0, nexus_1.objectType)({
    name: "Baker",
    definition(t) {
        t.nonNull.string("address");
        t.string("explorerUrl");
        t.field("lastProcessed", { type: exports.LastProcessed });
        t.nonNull.int("headDistance");
        t.nonNull.int("blocksPerCycle");
        t.nonNull.int("atRiskThreshold");
        t.nonNull.list.field("recentEvents", { type: (0, nexus_1.nonNull)(exports.LevelEvents) });
        t.field("balance", {
            type: "String",
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                try {
                    return await ctx.rpc.getFullBalance(parent.address, `head~${parent.headDistance}`);
                }
                catch (err) {
                    throw mkGQLError(err);
                }
            },
        });
        t.field("frozenBalance", {
            type: "String",
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                try {
                    return await ctx.rpc.getFrozenDeposits(parent.address, `head~${parent.headDistance}`);
                }
                catch (err) {
                    throw mkGQLError(err);
                }
            },
        });
        t.field("stakingBalance", {
            type: "String",
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                try {
                    return await ctx.rpc.getStakingBalance(parent.address, `head~${parent.headDistance}`);
                }
                catch (err) {
                    throw mkGQLError(err);
                }
            },
        });
        t.field("gracePeriod", {
            type: "Int",
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                // return 0;
                const { cycle, level } = parent.lastProcessed;
                const { address } = parent;
                return await getGracePeriod(ctx.rpc, cycle, level, address, parent.atRiskThreshold);
            },
        });
        t.field("consensusKey", {
            type: exports.ConsensusKey,
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                const { cycle, level } = parent.lastProcessed;
                const protocol = await getProtocol(cycle, level, ctx);
                if (protocol.startsWith("PtKathman")) {
                    return null;
                }
                try {
                    const consensusKey = await ctx.rpc.getConsensusKey(parent.address, `head~${parent.headDistance}`);
                    if (!consensusKey)
                        return null;
                    let activePkh;
                    if (typeof consensusKey.active === "string") {
                        activePkh = consensusKey.active;
                    }
                    else {
                        activePkh = consensusKey.active.pkh;
                    }
                    return {
                        ...consensusKey,
                        active: activePkh,
                        explorerUrl: mkExplorerUrl(ctx, activePkh),
                    };
                }
                catch (err) {
                    throw mkGQLError(err);
                }
            },
        });
        t.field("atRisk", {
            type: "Boolean",
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                const { cycle, level } = parent.lastProcessed;
                const { address } = parent;
                const gracePeriod = await getGracePeriod(ctx.rpc, cycle, level, address, parent.atRiskThreshold);
                return gracePeriod - cycle <= parent.atRiskThreshold;
            },
        });
        t.field("deactivated", {
            type: "Boolean",
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                const { cycle, level } = parent.lastProcessed;
                const { address } = parent;
                const cacheKey = `${cycle}:${address}:deactivated`;
                let value = bakerCache.get(cacheKey);
                if (!value) {
                    try {
                        value = await ctx.rpc.getDeactivated(address, `${level}`);
                        bakerCache.set(cacheKey, value);
                    }
                    catch (err) {
                        throw mkGQLError(err);
                    }
                }
                return value;
            },
        });
        t.field("participation", {
            type: exports.Participation,
            async resolve(parent, _args, ctx) {
                if (!parent.lastProcessed)
                    return null;
                const { cycle, level } = parent.lastProcessed;
                const protocol = await getProtocol(cycle, level, ctx);
                if (protocol.startsWith("PtHangz2")) {
                    return null;
                }
                try {
                    const participation = await ctx.rpc.getParticipation(parent.address, `head~${parent.headDistance}`);
                    if ("expected_attesting_rewards" in participation) {
                        return {
                            ...participation,
                            expected_endorsing_rewards: participation.expected_attesting_rewards,
                        };
                    }
                    return participation;
                }
                catch (err) {
                    throw mkGQLError(err);
                }
            },
        });
        t.nonNull.string("updatedAt");
    },
});
exports.Bakers = (0, nexus_1.objectType)({
    name: "Bakers",
    definition(t) {
        t.nonNull.field("items", { type: (0, nexus_1.list)((0, nexus_1.nonNull)(exports.Baker)) });
        t.nonNull.int("totalCount");
    },
});
let cycleProtocol = { cycle: -1, protocol: "" };
const getProtocol = async (cycle, level, ctx) => {
    let protocol;
    if (cycleProtocol.cycle === cycle) {
        protocol = cycleProtocol.protocol;
    }
    else {
        protocol = (await ctx.rpc.getBlockHeader(`${level}`)).protocol;
        cycleProtocol = { cycle, protocol };
    }
    return protocol;
};
exports.TzAddressAlias = (0, nexus_1.objectType)({
    name: "TzAddressAlias",
    definition(t) {
        t.nonNull.string("alias");
        t.nonNull.string("address");
    },
});
exports.BakerQuery = (0, nexus_1.extendType)({
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field("aliases", {
            type: exports.TzAddressAlias,
            async resolve(_root, _args, { aliasMap }) {
                return Object.entries(aliasMap).map(([k, v]) => ({
                    address: k,
                    alias: v,
                }));
            },
        });
        t.nonNull.field("bakers", {
            type: exports.Bakers,
            args: {
                offset: (0, nexus_1.nonNull)((0, nexus_1.intArg)()),
                limit: (0, nexus_1.nonNull)((0, nexus_1.intArg)()),
                bakers: (0, nexus_1.list)((0, nexus_1.nonNull)((0, nexus_1.stringArg)())),
            },
            async resolve(_root, { offset, limit, bakers: bakersFilter }, ctx) {
                const bakerMonitorInfo = await ctx.bakerInfoCollection.info();
                const bakerInfo = bakersFilter && bakersFilter.length > 0
                    ? bakerMonitorInfo.bakerInfo.filter((x) => bakersFilter.includes(x.address))
                    : bakerMonitorInfo.bakerInfo;
                if (bakersFilter) {
                    const sortWeights = {};
                    for (let i = 0; i < bakersFilter.length; i++) {
                        sortWeights[bakersFilter[i]] = i;
                    }
                    bakerInfo.sort((a, b) => sortWeights[a.address] - sortWeights[b.address]);
                }
                const bakers = bakerInfo
                    .slice(offset, offset + limit)
                    .map(async (bakerInfo) => {
                    const grouped = (0, lodash_1.groupBy)(await bakerInfo.recentEvents(), "level");
                    const recentEvents = Object.entries(grouped).map(([levelStr, events]) => {
                        events = (0, lodash_1.orderBy)(events, "kind", "desc");
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const firstEvent = (0, lodash_1.first)(events);
                        return {
                            level: parseInt(levelStr),
                            explorerUrl: mkExplorerUrl(ctx, levelStr),
                            cycle: firstEvent.cycle,
                            timestamp: firstEvent.timestamp.toISOString(),
                            events: events.map((e) => {
                                return {
                                    kind: e.kind,
                                    priority: "priority" in e ? e.priority : null,
                                    slotCount: "slotCount" in e ? e.slotCount : null,
                                };
                            }),
                        };
                    });
                    return {
                        address: bakerInfo.address,
                        blocksPerCycle: bakerMonitorInfo.blocksPerCycle,
                        atRiskThreshold: bakerMonitorInfo.atRiskThreshold,
                        explorerUrl: mkExplorerUrl(ctx, bakerInfo.address),
                        recentEvents: (0, lodash_1.take)((0, lodash_1.orderBy)(recentEvents, "level", "desc"), 5),
                        lastProcessed: bakerMonitorInfo.lastProcessed,
                        headDistance: bakerMonitorInfo.headDistance,
                        updatedAt: new Date().toISOString(),
                    };
                });
                return { items: bakers, totalCount: bakerInfo.length };
            },
        });
        t.field("networkInfo", {
            type: exports.NetworkInfo,
            async resolve(_root, _args, ctx) {
                const bakerMonitorInfo = await ctx.bakerInfoCollection.info();
                if (!bakerMonitorInfo || !bakerMonitorInfo.lastProcessed)
                    return null;
                const { level, cycle, cyclePosition } = bakerMonitorInfo.lastProcessed;
                const protocol = await getProtocol(cycle, level, ctx);
                return {
                    level,
                    protocol,
                    cycle,
                    cyclePosition: typeof cyclePosition === "number" ? cyclePosition : 0,
                    blocksPerCycle: bakerMonitorInfo.blocksPerCycle,
                };
            },
        });
    },
});
