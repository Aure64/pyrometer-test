import {
  extendType,
  objectType,
  stringArg,
  nonNull,
  inputObjectType,
  arg,
} from "nexus";
import {
  validateAddress,
  ValidationResult as TzValidationResult,
} from "@taquito/utils";

const AuthResult = objectType({
  name: "AuthResult",
  definition(t) {
    t.nonNull.boolean("success");
    t.string("message");
  },
});

const MutationResult = objectType({
  name: "MutationResult",
  definition(t) {
    t.nonNull.boolean("success");
    t.string("message");
  },
});

const BakerMonitorSettingsInput = inputObjectType({
  name: "BakerMonitorSettingsInput",
  definition(t) {
    t.string("rpc");
    t.int("max_catchup_blocks");
    t.int("head_distance");
    t.int("missed_threshold");
  },
});

const BakerMonitorSettings = objectType({
  name: "BakerMonitorSettings",
  definition(t) {
    t.nonNull.string("rpc");
    t.nonNull.int("maxCatchupBlocks");
    t.nonNull.int("headDistance");
    t.nonNull.int("missedThreshold");
  },
});

const checkAuth = (
  authHeader: string | undefined,
  adminToken: string | undefined,
): boolean => {
  if (!adminToken) return false;
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  return token === adminToken;
};

export const AdminMutations = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("authenticate", {
      type: AuthResult,
      args: { token: nonNull(stringArg()) },
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
      args: { address: nonNull(stringArg()) },
      resolve(_root, { address }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        if (validateAddress(address) !== TzValidationResult.VALID) {
          return { success: false, message: "Invalid Tezos address" };
        }
        ctx.configManager.addBaker(address);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("removeBaker", {
      type: MutationResult,
      args: { address: nonNull(stringArg()) },
      resolve(_root, { address }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        ctx.configManager.removeBaker(address);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("setAlias", {
      type: MutationResult,
      args: {
        address: nonNull(stringArg()),
        alias: nonNull(stringArg()),
      },
      resolve(_root, { address, alias }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        ctx.configManager.updateAlias(address, alias);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("removeAlias", {
      type: MutationResult,
      args: { address: nonNull(stringArg()) },
      resolve(_root, { address }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        ctx.configManager.updateAlias(address, null);
        return { success: true, message: null };
      },
    });

    t.nonNull.field("updateBakerMonitorSettings", {
      type: MutationResult,
      args: {
        input: nonNull(arg({ type: BakerMonitorSettingsInput })),
      },
      resolve(_root, { input }, ctx, info) {
        const authHeader = (info.rootValue as any)?.headers?.authorization;
        if (!checkAuth(authHeader, ctx.adminToken)) {
          return { success: false, message: "Unauthorized" };
        }
        if (!ctx.configManager) {
          return { success: false, message: "Config manager not available" };
        }
        const updates: Record<string, unknown> = {};
        if (input.rpc != null) updates.rpc = input.rpc;
        if (input.max_catchup_blocks != null)
          updates.max_catchup_blocks = input.max_catchup_blocks;
        if (input.head_distance != null)
          updates.head_distance = input.head_distance;
        if (input.missed_threshold != null)
          updates.missed_threshold = input.missed_threshold;
        ctx.configManager.updateSettings(updates);
        return { success: true, message: null };
      },
    });
  },
});

export const AdminQueries = extendType({
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
        if (!ctx.configManager) return [];
        return ctx.configManager.getBakers();
      },
    });
  },
});
