"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminQueries = exports.AdminMutations = void 0;
const nexus_1 = require("nexus");
const utils_1 = require("@taquito/utils");
const AuthResult = (0, nexus_1.objectType)({
    name: "AuthResult",
    definition(t) {
        t.nonNull.boolean("success");
        t.string("message");
    },
});
const MutationResult = (0, nexus_1.objectType)({
    name: "MutationResult",
    definition(t) {
        t.nonNull.boolean("success");
        t.string("message");
    },
});
const BakerMonitorSettingsInput = (0, nexus_1.inputObjectType)({
    name: "BakerMonitorSettingsInput",
    definition(t) {
        t.string("rpc");
        t.int("max_catchup_blocks");
        t.int("head_distance");
        t.int("missed_threshold");
    },
});
const BakerMonitorSettings = (0, nexus_1.objectType)({
    name: "BakerMonitorSettings",
    definition(t) {
        t.nonNull.string("rpc");
        t.nonNull.int("maxCatchupBlocks");
        t.nonNull.int("headDistance");
        t.nonNull.int("missedThreshold");
    },
});
const checkAuth = (authHeader, adminToken) => {
    if (!adminToken)
        return false;
    if (!authHeader)
        return false;
    const token = authHeader.replace("Bearer ", "");
    return token === adminToken;
};
const isValidTzAddress = (address) => (0, utils_1.validateAddress)(address) === utils_1.ValidationResult.VALID;
const extractAuth = (rootValue) => {
    if (typeof rootValue !== "object" || rootValue === null)
        return undefined;
    const headers = rootValue.headers;
    if (typeof headers !== "object" || headers === null)
        return undefined;
    const auth = headers.authorization;
    return typeof auth === "string" ? auth : undefined;
};
const guard = (ctx, info) => {
    if (!checkAuth(extractAuth(info.rootValue), ctx.adminToken)) {
        return { ok: false, result: { success: false, message: "Unauthorized" } };
    }
    if (!ctx.configManager) {
        return {
            ok: false,
            result: { success: false, message: "Config manager not available" },
        };
    }
    return { ok: true };
};
exports.AdminMutations = (0, nexus_1.extendType)({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("authenticate", {
            type: AuthResult,
            args: { token: (0, nexus_1.nonNull)((0, nexus_1.stringArg)()) },
            resolve(_root, { token }, ctx) {
                if (!ctx.adminToken) {
                    return { success: false, message: "Admin access not configured" };
                }
                if (token === ctx.adminToken) {
                    return { success: true, message: null };
                }
                return { success: false, message: "Invalid token" };
            },
        });
        t.nonNull.field("addBaker", {
            type: MutationResult,
            args: { address: (0, nexus_1.nonNull)((0, nexus_1.stringArg)()) },
            resolve(_root, { address }, ctx, info) {
                const g = guard(ctx, info);
                if (!g.ok)
                    return g.result;
                if (!isValidTzAddress(address)) {
                    return { success: false, message: "Invalid Tezos address" };
                }
                ctx.configManager.addBaker(address);
                return { success: true, message: null };
            },
        });
        t.nonNull.field("removeBaker", {
            type: MutationResult,
            args: { address: (0, nexus_1.nonNull)((0, nexus_1.stringArg)()) },
            resolve(_root, { address }, ctx, info) {
                const g = guard(ctx, info);
                if (!g.ok)
                    return g.result;
                if (!isValidTzAddress(address)) {
                    return { success: false, message: "Invalid Tezos address" };
                }
                ctx.configManager.removeBaker(address);
                return { success: true, message: null };
            },
        });
        t.nonNull.field("setAlias", {
            type: MutationResult,
            args: {
                address: (0, nexus_1.nonNull)((0, nexus_1.stringArg)()),
                alias: (0, nexus_1.nonNull)((0, nexus_1.stringArg)()),
            },
            resolve(_root, { address, alias }, ctx, info) {
                const g = guard(ctx, info);
                if (!g.ok)
                    return g.result;
                if (!isValidTzAddress(address)) {
                    return { success: false, message: "Invalid Tezos address" };
                }
                const trimmed = alias.trim();
                if (trimmed.length === 0 || trimmed.length > 64) {
                    return { success: false, message: "Alias must be 1-64 characters" };
                }
                ctx.configManager.updateAlias(address, trimmed);
                return { success: true, message: null };
            },
        });
        t.nonNull.field("removeAlias", {
            type: MutationResult,
            args: { address: (0, nexus_1.nonNull)((0, nexus_1.stringArg)()) },
            resolve(_root, { address }, ctx, info) {
                const g = guard(ctx, info);
                if (!g.ok)
                    return g.result;
                if (!isValidTzAddress(address)) {
                    return { success: false, message: "Invalid Tezos address" };
                }
                ctx.configManager.updateAlias(address, null);
                return { success: true, message: null };
            },
        });
        t.nonNull.field("updateBakerMonitorSettings", {
            type: MutationResult,
            args: {
                input: (0, nexus_1.nonNull)((0, nexus_1.arg)({ type: BakerMonitorSettingsInput })),
            },
            resolve(_root, { input }, ctx, info) {
                const g = guard(ctx, info);
                if (!g.ok)
                    return g.result;
                const updates = {};
                if (input.rpc != null) {
                    if (!/^https?:\/\//.test(input.rpc)) {
                        return { success: false, message: "RPC must be an http(s) URL" };
                    }
                    updates.rpc = input.rpc;
                }
                if (input.max_catchup_blocks != null) {
                    if (input.max_catchup_blocks < 0) {
                        return { success: false, message: "max_catchup_blocks must be >= 0" };
                    }
                    updates.max_catchup_blocks = input.max_catchup_blocks;
                }
                if (input.head_distance != null) {
                    if (input.head_distance < 0) {
                        return { success: false, message: "head_distance must be >= 0" };
                    }
                    updates.head_distance = input.head_distance;
                }
                if (input.missed_threshold != null) {
                    if (input.missed_threshold < 1) {
                        return { success: false, message: "missed_threshold must be >= 1" };
                    }
                    updates.missed_threshold = input.missed_threshold;
                }
                ctx.configManager.updateSettings(updates);
                return { success: true, message: null };
            },
        });
    },
});
exports.AdminQueries = (0, nexus_1.extendType)({
    type: "Query",
    definition(t) {
        t.nonNull.field("bakerMonitorSettings", {
            type: BakerMonitorSettings,
            resolve(_root, _args, ctx) {
                if (!ctx.configManager) {
                    return {
                        rpc: "",
                        maxCatchupBlocks: 0,
                        headDistance: 0,
                        missedThreshold: 0,
                    };
                }
                const s = ctx.configManager.getSettings();
                return {
                    rpc: s.rpc,
                    maxCatchupBlocks: s.max_catchup_blocks,
                    headDistance: s.head_distance,
                    missedThreshold: s.missed_threshold,
                };
            },
        });
        t.nonNull.boolean("isAdminConfigured", {
            resolve(_root, _args, ctx) {
                return !!ctx.adminToken;
            },
        });
        t.nonNull.list.nonNull.string("configuredBakers", {
            resolve(_root, _args, ctx) {
                if (!ctx.configManager)
                    return [];
                return ctx.configManager.getBakers();
            },
        });
    },
});
