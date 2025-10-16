"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path_1 = require("path");
const events_1 = require("./events");
const eventlog = __importStar(require("./eventlog"));
const channel = __importStar(require("./channel"));
const loglevel_1 = require("loglevel");
(0, loglevel_1.setLevel)("SILENT");
const mkTempDir = async () => {
    const tmpDir = os.tmpdir();
    return await fs.promises.mkdtemp(`${tmpDir}${path_1.sep}pyrometer-storage-test`, "utf8");
};
const mkEventLog = async (storageDir) => {
    const eventLog = await eventlog.open(storageDir);
    const ago = (minutes) => new Date(Date.now() - minutes * 60 * 1e3);
    const item1 = {
        kind: events_1.Events.Baked,
        baker: "tz1abc",
        level: 1,
        cycle: 1,
        createdAt: ago(7),
        timestamp: new Date(),
        priority: 0,
    };
    const item2 = {
        kind: events_1.Events.Endorsed,
        baker: "tz1abc",
        level: 2,
        cycle: 1,
        createdAt: ago(5),
        timestamp: new Date(),
        slotCount: 1,
    };
    const item3 = {
        kind: events_1.Events.MissedEndorsement,
        baker: "tz1abc",
        level: 3,
        cycle: 1,
        createdAt: ago(3),
        timestamp: new Date(),
        slotCount: 2,
    };
    await eventLog.add(item1);
    await eventLog.add(item2);
    await eventLog.add(item3);
    return [eventLog, [item1, item2, item3]];
};
describe("channel", () => {
    it("sends in batches", async () => {
        const storageDir = await mkTempDir();
        const [eventLog, [item1, item2, item3]] = await mkEventLog(storageDir);
        const batches = [];
        const max_batch_size = 1;
        const interval = 0.1;
        const ttl = Number.MAX_SAFE_INTEGER;
        const chan = await channel.create("test", async (events) => {
            batches.push(events);
        }, storageDir, eventLog, { max_batch_size, ttl, interval });
        setTimeout(() => chan.stop(), interval * 5e3);
        await chan.start();
        expect(batches).toEqual([[item1], [item2], [item3]]);
    });
    it("batch can be smaller than max", async () => {
        const storageDir = await mkTempDir();
        const [eventLog, [item1, item2, item3]] = await mkEventLog(storageDir);
        const batches = [];
        const max_batch_size = 2;
        const interval = 0.1;
        const ttl = Number.MAX_SAFE_INTEGER;
        const chan = await channel.create("test", async (events) => {
            batches.push(events);
        }, storageDir, eventLog, { max_batch_size, ttl, interval });
        setTimeout(() => chan.stop(), interval * 5e3);
        await chan.start();
        expect(batches).toEqual([[item1, item2], [item3]]);
    });
    it("discards old messages", async () => {
        const storageDir = await mkTempDir();
        const [eventLog, [_item1, _item2, item3]] = await mkEventLog(storageDir);
        const batches = [];
        const max_batch_size = 50;
        const interval = 0.1;
        const ttl = 4 * 60;
        const chan = await channel.create("test", async (events) => {
            batches.push(events);
        }, storageDir, eventLog, { max_batch_size, ttl, interval });
        setTimeout(() => chan.stop(), interval * 5e3);
        await chan.start();
        expect(batches).toEqual([[item3]]);
    });
    it("retries", async () => {
        const storageDir = await mkTempDir();
        const [eventLog, [item1, item2, item3]] = await mkEventLog(storageDir);
        const batches = [];
        const max_batch_size = 3;
        const interval = 0.1;
        const ttl = Number.MAX_SAFE_INTEGER;
        let attempt = 0;
        const chan = await channel.create("test", async (events) => {
            attempt += 1;
            if (attempt === 1)
                throw new Error("simulated error");
            batches.push(events);
        }, storageDir, eventLog, { max_batch_size, ttl, interval });
        setTimeout(() => chan.stop(), interval * 5e3);
        await chan.start();
        expect(batches).toEqual([[item1, item2, item3]]);
    });
});
