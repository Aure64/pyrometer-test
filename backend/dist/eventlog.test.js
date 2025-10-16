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
const eventlog = __importStar(require("./eventlog"));
const mkTempDir = async () => {
    const tmpDir = os.tmpdir();
    return await fs.promises.mkdtemp(`${tmpDir}${path_1.sep}pyrometer-storage-test`, "utf8");
};
describe("eventlog", () => {
    const item1 = { a: 1 };
    const item2 = { b: 2 };
    const item3 = { c: 3 };
    const item4 = { c: 4 };
    it("appends and reads items", async () => {
        const elog = await eventlog.open(await mkTempDir());
        const entry1 = await elog.add(item1);
        const entry2 = await elog.add(item2);
        const entry3 = await elog.add(item3);
        const batch = [];
        for await (const record of elog.readFrom(0)) {
            batch.push(record);
        }
        expect(batch).toEqual([entry1, entry2, entry3]);
        const batch2 = [];
        for await (const record of elog.readFrom(-2)) {
            batch2.push(record);
        }
        expect(batch2).toEqual([entry2, entry3]);
    });
    it("doesn't exceed max size", async () => {
        const elog = await eventlog.open(await mkTempDir(), "testlog", 3);
        await elog.add(item1);
        const entry2 = await elog.add(item2);
        const entry3 = await elog.add(item3);
        const entry4 = await elog.add(item4);
        const batch = [];
        for await (const record of elog.readFrom(0)) {
            batch.push(record);
        }
        expect(batch).toEqual([entry2, entry3, entry4]);
    });
    it("deletes items", async () => {
        const elog = await eventlog.open(await mkTempDir());
        await elog.add(item1);
        await elog.add(item2);
        const lastEntry = await elog.add(item3);
        await elog.deleteUpTo(lastEntry.position - 1);
        const batch = [];
        for await (const record of elog.readFrom(0)) {
            batch.push(record);
        }
        expect(batch).toEqual([lastEntry]);
    });
});
