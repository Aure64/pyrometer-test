"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SysInfoQuery = exports.SysInfo = exports.OsData = exports.FsSizeData = exports.MemData = exports.CurrentLoadData = exports.CpuTemperatureData = exports.CpuData = void 0;
const systeminformation_1 = __importDefault(require("systeminformation"));
const nexus_1 = require("nexus");
exports.CpuData = (0, nexus_1.objectType)({
    name: "CpuData",
    definition(t) {
        t.nonNull.int("cores");
        t.nonNull.string("brand");
        t.nonNull.string("model");
        t.nonNull.string("family");
        t.nonNull.string("manufacturer");
    },
});
exports.CpuTemperatureData = (0, nexus_1.objectType)({
    name: "CpuTemperatureData",
    definition(t) {
        t.nonNull.list.float("cores");
        t.float("main");
        t.float("max");
        t.list.float("socket");
        t.float("chipset");
    },
});
exports.CurrentLoadData = (0, nexus_1.objectType)({
    name: "CurrentLoadData",
    definition(t) {
        t.nonNull.float("avgLoad");
    },
});
exports.MemData = (0, nexus_1.objectType)({
    name: "MemData",
    definition(t) {
        t.nonNull.float("total");
        t.nonNull.float("used");
        t.nonNull.float("active");
        t.nonNull.float("swaptotal");
        t.nonNull.float("swapused");
    },
});
exports.FsSizeData = (0, nexus_1.objectType)({
    name: "FsSizeData",
    definition(t) {
        t.nonNull.float("available");
        t.nonNull.float("used");
        t.nonNull.float("use");
        t.nonNull.string("fs");
        t.nonNull.string("mount");
        t.nonNull.float("size");
        t.nonNull.string("type");
    },
});
exports.OsData = (0, nexus_1.objectType)({
    name: "OsData",
    definition(t) {
        t.string("arch");
        t.string("build");
        t.string("codename");
        t.string("codepage");
        t.string("distro");
        t.string("fqdn");
        t.string("hostname");
        t.boolean("hypervizor");
        t.string("kernel");
        t.string("platform");
        t.string("release");
        t.string("servicepack");
    },
});
exports.SysInfo = (0, nexus_1.objectType)({
    name: "SysInfo",
    definition(t) {
        t.nonNull.field("cpu", { type: exports.CpuData });
        t.nonNull.field("cpuTemperature", { type: exports.CpuTemperatureData });
        t.nonNull.field("currentLoad", { type: exports.CurrentLoadData });
        t.nonNull.field("mem", { type: exports.MemData });
        t.nonNull.float("fullLoad");
        t.nonNull.field("inetLatency", {
            type: "Float",
            async resolve() {
                //this is slow
                return await systeminformation_1.default.inetLatency();
            },
        });
        t.nonNull.list.field("fsSize", {
            type: exports.FsSizeData,
            async resolve() {
                const fsSize = await systeminformation_1.default.fsSize();
                return fsSize;
            },
        });
        t.nonNull.field("osInfo", {
            type: exports.OsData,
            async resolve() {
                const os = await systeminformation_1.default.osInfo();
                return os;
            },
        });
    },
});
exports.SysInfoQuery = (0, nexus_1.extendType)({
    type: "Query",
    definition(t) {
        t.nonNull.field("sysInfo", {
            type: exports.SysInfo,
            async resolve(_, _args, ctx) {
                if (!ctx.showSystemInfo) {
                    throw new Error("not enabled");
                }
                const cpu = await systeminformation_1.default.cpu();
                const cpuTemperature = await systeminformation_1.default.cpuTemperature();
                const currentLoad = await systeminformation_1.default.currentLoad();
                const mem = await systeminformation_1.default.mem();
                const fullLoad = await systeminformation_1.default.fullLoad();
                return {
                    cpu,
                    cpuTemperature,
                    currentLoad,
                    mem,
                    fullLoad,
                };
            },
        });
    },
});
