"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsQuery = exports.Settings = void 0;
const nexus_1 = require("nexus");
exports.Settings = (0, nexus_1.objectType)({
    name: "Settings",
    definition(t) {
        t.nonNull.boolean("showSystemInfo");
    },
});
exports.SettingsQuery = (0, nexus_1.extendType)({
    type: "Query",
    definition(t) {
        t.nonNull.field("settings", {
            type: exports.Settings,
            async resolve(_, _args, ctx) {
                return {
                    showSystemInfo: ctx.showSystemInfo || false,
                };
            },
        });
    },
});
