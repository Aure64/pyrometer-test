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
const storage = __importStar(require("./storage"));
const mkTempStorage = async () => {
    const tmpDir = os.tmpdir();
    const dir = await fs.promises.mkdtemp(`${tmpDir}${path_1.sep}pyrometer-storage-test`, "utf8");
    return await storage.open(dir);
};
describe("storage", () => {
    it("stores and retrieves items", async () => {
        const store = await mkTempStorage();
        expect(await store.keys()).toEqual([]);
        const item1 = { a: 1, b: new Date(1624845623) };
        const item2 = 42;
        const item3 = "hello";
        await store.put("a", item1);
        await store.put("b", item2);
        await store.put("c", item3);
        expect(await store.keys()).toEqual(["a", "b", "c"]);
        expect(await store.get("c")).toEqual(item3);
        expect(await store.get("b")).toEqual(item2);
        expect(await store.get("a")).toEqual(item1);
    });
    it("can delete items", async () => {
        const store = await mkTempStorage();
        const item1 = { a: 1 };
        await store.put("a", item1);
        expect(await store.keys()).toEqual(["a"]);
        await store.remove("a");
        expect(await store.keys()).toEqual([]);
    });
    it("deleting non-existing file is not an error", async () => {
        const store = await mkTempStorage();
        const item1 = { a: 1 };
        await store.put("a", item1);
        await store.remove("a");
        await store.remove("a");
        expect(await store.keys()).toEqual([]);
    });
    it("returns null for non-existing keys", async () => {
        const store = await mkTempStorage();
        expect(await store.get("abc")).toEqual(null);
    });
});
