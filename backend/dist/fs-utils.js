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
exports.ensureExists = exports.readJson = exports.writeJsonSync = exports.writeJson = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(require("fs"));
const loglevel_1 = require("loglevel");
const path_1 = require("path");
const encoding = "utf8";
const datePrefix = "~d:";
const datePrefixLen = datePrefix.length;
function jsonReplacer(key, value) {
    if (this[key] instanceof Date) {
        return `${datePrefix}${value}`;
    }
    return value;
}
function jsonReviver(_key, value) {
    if (typeof value === "string" && value.startsWith(datePrefix)) {
        return new Date(value.substring(datePrefixLen));
    }
    return value;
}
const writeJson = async (fileName, value) => await fs.promises.writeFile(fileName, JSON.stringify(value, jsonReplacer), encoding);
exports.writeJson = writeJson;
const writeJsonSync = async (fileName, value) => fs.writeFileSync(fileName, JSON.stringify(value, jsonReplacer), encoding);
exports.writeJsonSync = writeJsonSync;
const readJson = async (fileName) => JSON.parse(await fs.promises.readFile(fileName, encoding), jsonReviver);
exports.readJson = readJson;
const ensureExists = async (fileName, initialValue) => {
    try {
        await fs.promises.access(fileName, fs.constants.F_OK);
    }
    catch (err) {
        (0, loglevel_1.debug)(`File ${fileName} doesn't exist, creating with value ${initialValue}`, err);
        const dir = (0, path_1.dirname)(fileName);
        await fs.promises.mkdir(dir, { recursive: true });
        await (0, exports.writeJson)(fileName, initialValue);
    }
};
exports.ensureExists = ensureExists;
