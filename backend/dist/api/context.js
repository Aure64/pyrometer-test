"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = void 0;
const client_1 = __importDefault(require("../rpc/client"));
const client_2 = require("../tzkt/client");
const createContext = (nodeInfoCollection, bakerInfoCollection, rpcUrl, rpcConfig, explorerUrl, showSystemInfo, aliasMap, tzktConfig) => {
    return {
        nodeInfoCollection,
        bakerInfoCollection,
        rpc: (0, client_1.default)(rpcUrl, rpcConfig),
        explorerUrl,
        showSystemInfo,
        aliasMap,
        tzkt: (0, client_2.createTzktClient)(tzktConfig),
    };
};
exports.createContext = createContext;
