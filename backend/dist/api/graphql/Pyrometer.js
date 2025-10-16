"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PyrometerInfoQuery = exports.PyrometerInfo = exports.ProcessData = exports.CpuUsage = void 0;
const process_1 = __importDefault(require("process"));
const systeminformation_1 = __importDefault(require("systeminformation"));
const nexus_1 = require("nexus");
exports.CpuUsage = (0, nexus_1.objectType)({
    name: "CpuUsage",
    definition(t) {
        t.float("user");
        t.float("system");
    },
});
exports.ProcessData = (0, nexus_1.objectType)({
    name: "ProcessInfo",
    definition(t) {
        t.nonNull.float("cpu");
        t.nonNull.float("mem");
        t.nonNull.float("memRss");
        t.nonNull.float("memVsz");
        t.nonNull.int("pid");
        t.nonNull.string("started");
        t.nonNull.string("command");
        t.nonNull.string("name");
        t.nonNull.string("user");
        t.string("params");
        t.string("path");
    },
});
const processDisplayCmp = (x, y) => x.command.localeCompare(y.command);
exports.PyrometerInfo = (0, nexus_1.objectType)({
    name: "PyrometerInfo",
    definition(t) {
        t.nonNull.field("version", {
            type: "String",
            async resolve() {
                return process_1.default.env.npm_package_version || "";
            },
        });
        t.nonNull.field("processes", {
            type: (0, nexus_1.list)((0, nexus_1.nonNull)(exports.ProcessData)),
            async resolve(_, _args, ctx) {
                if (!ctx.showSystemInfo) {
                    throw new Error("not enabled");
                }
                const processes = await systeminformation_1.default.processes();
                return processes.list
                    .filter((x) => x.pid === process_1.default.pid ||
                    x.command.includes("octez") ||
                    x.command.includes("tezos"))
                    .map((x) => {
                    const started = new Date(x.started);
                    let startedISO = "";
                    try {
                        startedISO = started.toISOString();
                    }
                    catch (err) {
                        console.error(`Failed to parse timestamp ${x.started}`, err);
                    }
                    const name = x.pid === process_1.default.pid ? "pyrometer" : x.name;
                    return { ...x, started: startedISO, name };
                })
                    .sort(processDisplayCmp);
            },
        });
    },
});
exports.PyrometerInfoQuery = (0, nexus_1.extendType)({
    type: "Query",
    definition(t) {
        t.nonNull.field("pyrometer", {
            type: exports.PyrometerInfo,
            async resolve(_, _args, ctx) {
                if (!ctx.showSystemInfo) {
                    throw new Error("not enabled");
                }
                return {};
            },
        });
    },
});
