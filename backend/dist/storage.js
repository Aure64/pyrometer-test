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
exports.open = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loglevel_1 = require("loglevel");
const fs_utils_1 = require("./fs-utils");
const path_1 = require("path");
const TMP_POSTFIX = ".tmp";
const isNotTmp = (fileName) => !fileName.endsWith(TMP_POSTFIX);
const open = async (storagePath) => {
    const log = (0, loglevel_1.getLogger)("storage");
    const storageDir = (0, path_1.normalize)(Array.isArray(storagePath) ? (0, path_1.join)(...storagePath) : storagePath);
    log.debug(`Storage path: ${storageDir}`);
    await fs.promises.mkdir(storageDir, { recursive: true });
    const stats = await fs.promises.stat(storageDir);
    if (!stats.isDirectory()) {
        throw Error(`${storageDir} must be a directory`);
    }
    const mkFullPath = (key) => path.join(storageDir, key.toString());
    const mkTmpPath = (key) => path.join(storageDir, `${key}${TMP_POSTFIX}`);
    const put = async (key, value) => {
        const tmp = mkTmpPath(key);
        const fileName = mkFullPath(key);
        await (0, fs_utils_1.writeJson)(tmp, value);
        await fs.promises.rename(tmp, fileName);
    };
    const putSync = (key, value) => {
        const tmp = mkTmpPath(key);
        const fileName = mkFullPath(key);
        (0, fs_utils_1.writeJsonSync)(tmp, value);
        fs.renameSync(tmp, fileName);
    };
    const get = async (key, defaultValue = null) => {
        const fileName = mkFullPath(key);
        try {
            return await (0, fs_utils_1.readJson)(fileName);
        }
        catch (err) {
            log.debug(`Could not read ${fileName}`, err);
            return defaultValue;
        }
    };
    const keys = async () => {
        return (await fs.promises.readdir(storageDir)).filter(isNotTmp);
    };
    const remove = async (key) => {
        try {
            await fs.promises.unlink(mkFullPath(key));
        }
        catch (err) {
            const e = err;
            if (e.code && e.code === "ENOENT") {
                //ignore
            }
            else
                throw err;
        }
    };
    return { put, putSync, get, remove, keys };
};
exports.open = open;
