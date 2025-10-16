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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBlockInfo = exports.create = void 0;
const node_url_1 = require("node:url");
const events_1 = require("./events");
const loglevel_1 = require("loglevel");
const lodash_1 = require("lodash");
const fs_utils_1 = require("./fs-utils");
const client_1 = __importDefault(require("./rpc/client"));
const util_1 = require("./rpc/util");
const service = __importStar(require("./service"));
const now_1 = __importDefault(require("./now"));
const create = async (onEvent, { nodes, teztnets, teztnets_config: teztnetsConfig, low_peer_count: lowPeerCount, }, rpcConfig) => {
    const teztnetsNodes = [];
    if (teztnets) {
        try {
            const read = teztnetsConfig.startsWith("https:") ||
                teztnetsConfig.startsWith("http:")
                ? util_1.get
                : fs_utils_1.readJson;
            const testNets = await read(teztnetsConfig);
            for (const [networkName, data] of Object.entries(testNets)) {
                if ("rpc_url" in data) {
                    const url = data.rpc_url;
                    const name = (data.human_name || new node_url_1.URL(url).hostname);
                    teztnetsNodes.push({ url, name });
                }
                else {
                    (0, loglevel_1.getLogger)("nm").warn(`Network ${networkName} has no rpc URL, skipping`, data);
                }
            }
        }
        catch (err) {
            (0, loglevel_1.getLogger)("nm").error(`Unable to get teztnets config from ${teztnetsConfig}`, err);
        }
    }
    //dedup
    const nodeSet = (0, lodash_1.uniqBy)([...nodes, ...teztnetsNodes], "url");
    const allSubs = nodeSet.map((node) => subscribeToNode(node, rpcConfig, onEvent, lowPeerCount));
    const start = async () => {
        await Promise.all(allSubs.map((s) => s.start()));
    };
    const stop = () => {
        for (const s of allSubs) {
            s.stop();
        }
    };
    const info = async () => {
        return allSubs.map((s) => s.nodeInfo()).filter((x) => !!x);
    };
    return { name: "nm", start, stop, info };
};
exports.create = create;
const eventKey = (event) => {
    if (event.kind === events_1.Events.RpcError) {
        return `${event.kind}:${event.message}`;
    }
    return event.kind;
};
const initialEndpointAvailability = {
    status: true,
    networkConnections: true,
    version: true,
};
const subscribeToNode = (node, rpcConfig, onEvent, lowPeerCount) => {
    const rpc = (0, client_1.default)(node.url, rpcConfig);
    const serviceName = `nm|${node.name}`;
    const log = (0, loglevel_1.getLogger)(serviceName);
    let nodeData = {
        node,
        endpoints: initialEndpointAvailability,
        unableToReach: false,
        head: undefined,
        peerCount: undefined,
        bootstrappedStatus: undefined,
        tezosVersion: undefined,
        error: undefined,
        updatedAt: new Date(),
        history: [],
    };
    let previousEvents = new Set();
    const task = async () => {
        let events = [];
        try {
            const previousNodeInfo = nodeData;
            const nodeInfo = await updateNodeInfo({
                node,
                rpc,
                endpoints: previousNodeInfo.endpoints,
                log,
            });
            if (nodeInfo.unableToReach) {
                log.debug("Unable to reach node");
                const err = nodeInfo.error;
                const message = err
                    ? err.status
                        ? `${node} returned ${err.status} ${err.statusText ?? ""}`
                        : err?.message
                    : "Unknown error";
                events.push({
                    kind: events_1.Events.RpcError,
                    message,
                    node: node.url,
                    createdAt: (0, now_1.default)(),
                });
            }
            else {
                events = (0, exports.checkBlockInfo)({
                    nodeInfo,
                    previousNodeInfo,
                    lowPeerCount,
                    log,
                });
            }
            // storing previous info in memory for now.  Eventually this will need to be persisted to the DB
            // with other data (eg current block)
            nodeData = nodeInfo;
            if (previousNodeInfo.unableToReach && !nodeInfo.unableToReach) {
                log.debug("Adding reconnected event");
                events.push({
                    kind: events_1.Events.RpcErrorResolved,
                    node: node.url,
                    createdAt: (0, now_1.default)(),
                });
            }
        }
        catch (err) {
            log.warn(`Node subscription error: ${err.message}`);
            events.push({
                kind: events_1.Events.RpcError,
                message: err.status
                    ? `${node} returned ${err.status} ${err.statusText ?? ""}`
                    : err.message,
                node: node.url,
                createdAt: (0, now_1.default)(),
            });
        }
        const publishedEvents = new Set();
        for (const event of events) {
            const key = eventKey(event);
            if (previousEvents.has(key)) {
                log.debug(`Event ${key} is already reported, not publishing`);
            }
            else {
                log.debug(`Event ${key} is new, publishing`);
                await onEvent(event);
            }
            publishedEvents.add(key);
        }
        previousEvents = publishedEvents;
    };
    const srv = service.create(serviceName, task, 30 * 1e3);
    return {
        name: srv.name,
        start: srv.start,
        stop: srv.stop,
        nodeInfo: () => nodeData,
    };
};
const UNAVAILABLE_RPC_HTTP_STATUS = [401, 403, 404];
const updateNodeInfo = async ({ node, rpc, endpoints, log, }) => {
    if (!log)
        log = (0, loglevel_1.getLogger)(__filename);
    let unableToReach = false;
    let history;
    let error;
    let blockHash;
    try {
        blockHash = await rpc.getBlockHash();
        log.debug(`Checking block ${blockHash}`);
        history = await rpc.getBlockHistory(blockHash);
    }
    catch (err) {
        const logMessage = blockHash
            ? `Unable to get block history for ${blockHash}: `
            : `Unable to get head block hash: `;
        let logStruct;
        if (err.name === "HttpRequestFailed") {
            logStruct = err.message;
        }
        else {
            logStruct = err;
        }
        log.warn(logMessage, logStruct);
        unableToReach = true;
        error = err;
        history = [];
    }
    let hasNetworkConnectionsEndpoint = endpoints.networkConnections;
    let hasStatusEndpoint = endpoints.status;
    let hasVersionEndpoint = endpoints.version;
    let bootstrappedStatus;
    let peerCount;
    let tezosVersion;
    if (!unableToReach) {
        if (endpoints.status) {
            try {
                bootstrappedStatus = await rpc.getBootsrappedStatus();
                log.debug(`bootstrap status:`, bootstrappedStatus);
            }
            catch (err) {
                log.warn(`Unable to get bootsrap status`, err);
                if (UNAVAILABLE_RPC_HTTP_STATUS.includes(err.status)) {
                    hasStatusEndpoint = false;
                }
            }
        }
        if (endpoints.networkConnections) {
            try {
                const connections = await rpc.getNetworkConnections();
                peerCount = connections.length;
                log.debug(`Node has ${peerCount} peers`);
            }
            catch (err) {
                log.warn(`Unable to get network connections info`, err);
                if (UNAVAILABLE_RPC_HTTP_STATUS.includes(err.status)) {
                    hasNetworkConnectionsEndpoint = false;
                }
            }
        }
        if (endpoints.version) {
            try {
                tezosVersion = await rpc.getTezosVersion();
                log.debug(`Tezos version:`, tezosVersion);
            }
            catch (err) {
                log.warn(`Unable to get tezos version info`, err);
                if (UNAVAILABLE_RPC_HTTP_STATUS.includes(err.status)) {
                    hasVersionEndpoint = false;
                }
            }
        }
    }
    return {
        node,
        endpoints: {
            status: hasStatusEndpoint,
            networkConnections: hasNetworkConnectionsEndpoint,
            version: hasVersionEndpoint,
        },
        head: blockHash,
        bootstrappedStatus,
        history,
        peerCount,
        tezosVersion,
        unableToReach,
        error,
        updatedAt: new Date(),
    };
};
/**
 * Analyze the provided node info for any significant events.
 */
const checkBlockInfo = ({ nodeInfo, previousNodeInfo, lowPeerCount, log, }) => {
    if (!log)
        log = (0, loglevel_1.getLogger)(__filename);
    const events = [];
    const newEvent = (kind) => {
        return { kind, node: nodeInfo.node.url, createdAt: (0, now_1.default)() };
    };
    if (nodeInfo.bootstrappedStatus) {
        if (nodeInfo.bootstrappedStatus.bootstrapped &&
            nodeInfo.bootstrappedStatus.sync_state !== "synced") {
            log.debug(`Node is behind`);
            if (previousNodeInfo &&
                previousNodeInfo.bootstrappedStatus?.sync_state !== "synced") {
                log.debug("Node was not synced already, not generating event");
            }
            else {
                events.push(newEvent(events_1.Events.NodeBehind));
            }
        }
        else if (catchUpOccurred(previousNodeInfo?.bootstrappedStatus, nodeInfo.bootstrappedStatus)) {
            log.debug(`Node caught up`);
            events.push(newEvent(events_1.Events.NodeSynced));
        }
    }
    else {
        log.warn(`Unable to check bootstrapped status`);
    }
    if (nodeInfo.peerCount !== undefined) {
        if (nodeInfo.peerCount <= lowPeerCount) {
            if (previousNodeInfo?.peerCount !== undefined &&
                previousNodeInfo.peerCount <= lowPeerCount) {
                log.debug("Node previously had too few peers, not generating event");
            }
            else {
                log.debug(`${nodeInfo.node.url} has low peer count: ${nodeInfo.peerCount}/${lowPeerCount}`);
                events.push(newEvent(events_1.Events.NodeLowPeers));
            }
        }
        if (nodeInfo.peerCount > lowPeerCount) {
            if (previousNodeInfo?.peerCount !== undefined &&
                previousNodeInfo.peerCount <= lowPeerCount) {
                log.debug(`${nodeInfo.node.url} low peer count resolved: ${nodeInfo.peerCount}/${lowPeerCount}`);
                events.push(newEvent(events_1.Events.NodeLowPeersResolved));
            }
            else {
                log.debug("Node previously had enough peers, not generating event");
            }
        }
    }
    return events;
};
exports.checkBlockInfo = checkBlockInfo;
const catchUpOccurred = (previousResult, currentStatus) => {
    // can't determine this without a previous status
    if (!previousResult) {
        return false;
        // no catch up if either status wasn't boostrapped
    }
    else if (!previousResult.bootstrapped || !currentStatus.bootstrapped) {
        return false;
    }
    else {
        return (previousResult.sync_state !== "synced" &&
            currentStatus.sync_state === "synced");
    }
};
