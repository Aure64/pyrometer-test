"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const client_1 = __importDefault(require("../rpc/client"));
const createContext = (nodeInfoCollection, bakerInfoCollection, rpcUrl, rpcConfig, explorerUrl, showSystemInfo, aliasMap) => {
    return {
        nodeInfoCollection,
        bakerInfoCollection,
        rpc: (0, client_1.default)(rpcUrl, rpcConfig),
        explorerUrl,
        showSystemInfo,
        aliasMap,
    };
};
exports.createContext = createContext;
