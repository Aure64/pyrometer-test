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
exports.checkHealth = exports.checkForDeactivations = exports.create = void 0;
const path_1 = require("path");
const loglevel_1 = require("loglevel");
const lru_cache_1 = require("lru-cache");
const util_1 = require("./rpc/util");
const delay_1 = require("./delay");
const service = __importStar(require("./service"));
const storage = __importStar(require("./storage"));
const format = __importStar(require("./format"));
const EventLog = __importStar(require("./eventlog"));
const client_1 = __importDefault(require("./rpc/client"));
const events_1 = require("./events");
const now_1 = __importDefault(require("./now"));
const bm_proto_h_1 = __importDefault(require("./bm-proto-h"));
const bm_proto_i_1 = __importDefault(require("./bm-proto-i"));
const bm_proto_j_1 = __importDefault(require("./bm-proto-j"));
const bm_proto_k_1 = __importDefault(require("./bm-proto-k"));
const bm_proto_l_1 = __importDefault(require("./bm-proto-l"));
const bm_proto_m_1 = __importDefault(require("./bm-proto-m"));
const bm_proto_n_1 = __importDefault(require("./bm-proto-n"));
const bm_proto_o_1 = __importDefault(require("./bm-proto-o"));
const bm_proto_p_1 = __importDefault(require("./bm-proto-p"));
const bm_proto_q_1 = __importDefault(require("./bm-proto-q"));
const bm_proto_r_1 = __importDefault(require("./bm-proto-r"));
const bm_proto_s_1 = __importDefault(require("./bm-proto-s"));
const name = "bm";
const missedKinds = new Set([
    events_1.Events.MissedBake,
    events_1.Events.MissedBonus,
    events_1.Events.MissedEndorsement,
]);
const successKinds = new Set([events_1.Events.Baked, events_1.Events.Endorsed]);
const create = async (storageDirectory, { bakers: configuredBakers, rpc: rpcNode, max_catchup_blocks: catchupLimit, head_distance: headDistance, missed_threshold: missedEventsThreshold, }, rpcConfig, enableHistory, onEvent) => {
    const MAX_HISTORY = Math.max(7, missedEventsThreshold);
    const log = (0, loglevel_1.getLogger)(name);
    const rpc = (0, client_1.default)(rpcNode.url, rpcConfig);
    const chainId = await (0, util_1.tryForever)(() => rpc.getChainId(), 60e3, "get chain id");
    log.info(`Chain: ${chainId}`);
    const constants = await (0, util_1.tryForever)(() => rpc.getConstants(), 60e3, "get protocol constants");
    log.info("Protocol constants", JSON.stringify(constants, null, 2));
    //dedup
    configuredBakers = [...new Set(configuredBakers)];
    const monitorAllActiveBakers = configuredBakers.some((x) => x === "*");
    if (monitorAllActiveBakers) {
        console.log("Monitoring all active bakers");
    }
    const activeBakersCache = new lru_cache_1.LRUCache({ max: 1 });
    const getMonitoredAddresses = async ({ blockLevel, blockCycle, }) => {
        if (monitorAllActiveBakers) {
            if (blockLevel < 0)
                return [];
            let activeBakers = activeBakersCache.get(blockCycle);
            if (!activeBakers) {
                activeBakers = await rpc.getActiveBakers(`${blockLevel}`);
                activeBakersCache.set(blockCycle, activeBakers);
            }
            return activeBakers;
        }
        return configuredBakers;
    };
    const CHAIN_POSITION_KEY = "position";
    const store = await storage.open([
        storageDirectory,
        "baker-monitor",
        chainId,
    ]);
    const bakerEventLogs = {};
    const historyDir = (0, path_1.join)(storageDirectory, "history");
    const getBakerEventLog = async (baker) => {
        let bakerLog = bakerEventLogs[baker];
        if (!bakerLog) {
            bakerLog = await EventLog.open(historyDir, baker, MAX_HISTORY);
            bakerEventLogs[baker] = bakerLog;
        }
        return bakerLog;
    };
    // for (const baker of bakers) {
    //   bakerEventLogs[baker] = await EventLog.open(historyDir, baker, MAX_HISTORY);
    // }
    const addToHistory = async (event) => {
        const bakerLog = await getBakerEventLog(event.baker);
        bakerLog.add(event);
    };
    const getPosition = async () => (await store.get(CHAIN_POSITION_KEY, {
        blockLevel: -1,
        blockCycle: -1,
        cyclePosition: -1,
    }));
    const setPosition = async (value) => await store.put(CHAIN_POSITION_KEY, value);
    // Ajustement Seoul: utiliser tolerated_inactivity_period si disponible,
    // sinon preserved_cycles (anciens protocoles), sinon consensus_rights_delay en dernier recours
    let atRiskThreshold;
    if ("tolerated_inactivity_period" in constants) {
        // sous Seoul, la période de tolérance d'inactivité (en cycles) reflète mieux le risque réel
        // on retire 1 cycle pour ne pas marquer "à risque" trop tôt dans le cycle courant
        const tip = constants.tolerated_inactivity_period;
        atRiskThreshold = Math.max(1, tip - 1);
    }
    else if ("preserved_cycles" in constants) {
        atRiskThreshold = constants.preserved_cycles;
    }
    else {
        atRiskThreshold = constants.consensus_rights_delay;
    }
    const missedCounts = new Map();
    const task = async (isInterrupted) => {
        try {
            const chainPosition = await getPosition();
            const bakers = await getMonitoredAddresses(chainPosition);
            const lastBlockLevel = chainPosition.blockLevel;
            let lastBlockCycle = chainPosition.blockCycle;
            log.debug(`Getting block header for head~${headDistance}`);
            const headMinusXHeader = await rpc.getBlockHeader(`head~${headDistance}`);
            const { level, hash } = headMinusXHeader;
            if (log.getLevel() <= 1) {
                const headHeader = await rpc.getBlockHeader("head");
                const { level: headLevel } = headHeader;
                log.debug(`Got block ${hash} at level ${level} [currently at ${lastBlockLevel}, head is ${headLevel}]`);
            }
            const minLevel = catchupLimit ? level - catchupLimit : level;
            const startLevel = lastBlockLevel
                ? Math.max(lastBlockLevel + 1, minLevel)
                : level;
            log.debug(`Processing blocks starting at level ${startLevel}`);
            let currentLevel = startLevel;
            while (currentLevel <= level && !isInterrupted()) {
                log.debug(`Processing block at level ${currentLevel} for ${bakers.length} baker(s)`);
                const block = await rpc.getBlock(`${currentLevel}`);
                if (block === undefined)
                    throw new Error(`Block ${currentLevel} not found`);
                const { metadata } = block;
                if (metadata === undefined) {
                    log.info(`Block ${block.hash} at level ${currentLevel} has no metadata, skipping`);
                    currentLevel++;
                    continue;
                }
                if (metadata.level_info === undefined) {
                    log.info(`Metadata for block ${block.hash} at level ${currentLevel} has no level info, skipping`);
                    currentLevel++;
                    continue;
                }
                const blockLevel = metadata.level_info.level;
                const blockCycle = metadata.level_info.cycle;
                const cyclePosition = metadata.level_info.cycle_position;
                if (blockLevel !== currentLevel) {
                    throw new Error(`Block level ${currentLevel} was requested but data returned level ${blockLevel}`);
                }
                let events;
                const protocolStr = block.protocol;
                switch (block.protocol) {
                    case "PtHangz2aRngywmSRGGvrcTyMbbdpWdpFKuS4uMWxg2RaH9i1qx":
                        events = await (0, bm_proto_h_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "Psithaca2MLRFYargivpo7YvUr7wUDqyxrdhC5CQq78mRvimz6A":
                        events = await (0, bm_proto_i_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PtJakart2xVj7pYXJBXrqHgd82rdkLey5ZeeGwDgPp9rhQUbSqY":
                        events = await (0, bm_proto_j_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PtKathmankSpLLDALzWw7CGD2j2MtyveTwboEYokqUCP4a1LxMg":
                        events = await (0, bm_proto_k_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PtLimaPtLMwfNinJi9rCfDPWea8dFgTZ1MeJ9f1m2SRic6ayiwW":
                        events = await (0, bm_proto_l_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PtMumbai2TmsJHNGRkD8v8YDbtao7BLUC3wjASn1inAKLFCjaH1":
                        events = await (0, bm_proto_m_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PtNairobiyssHuh87hEhfVBGCVrK3WnS8Z2FT4ymB5tAa4r1nQf":
                        events = await (0, bm_proto_n_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "ProxfordYmVfjWnRcgjWH36fW6PArwqykTFzotUxRs6gmTcZDuH":
                        events = await (0, bm_proto_o_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PtParisBxoLz5gzMmn3d9WBQNoPSZakgnkMC2VNuQ3KXfUtUQeZ":
                        events = await (0, bm_proto_p_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PsParisCZo7KAh1Z1smVd9ZMZ1HHn5gkzbM94V3PLCpknFWhUAi":
                        events = await (0, bm_proto_p_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PsQuebecnLByd3JwTiGadoG4nGWi3HYiLXUjkibeFV8dCFeVMUg":
                        events = await (0, bm_proto_q_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    case "PsRiotumaAMotcRoDWW1bysEhQy2n1M5fy8JgRp8jjRfHGmfeA7":
                        events = await (0, bm_proto_r_1.default)({
                            bakers,
                            block,
                            rpc: rpc,
                        });
                        break;
                    // Seoul (023 / V15)
                    case "PtSeouLouXkxhg39oWzjxDWaCydNfR3RxCUrNe4Q9Ro8BTehcbh":
                        events = await (0, bm_proto_s_1.default)({
                            bakers,
                            // @ts-ignore types Union; bloc Seoul
                            block: block,
                            rpc: rpc,
                        });
                        break;
                    default:
                        console.warn(`Unknown protocol at level ${blockLevel}`);
                        events = [];
                }
                const bakerHealthEvents = [];
                for (const { event, baker, newCount } of checkHealth(events, missedEventsThreshold, missedCounts)) {
                    if (event) {
                        bakerHealthEvents.push({
                            kind: event,
                            baker,
                            createdAt: new Date(),
                            level: blockLevel,
                            cycle: blockCycle,
                            timestamp: new Date(block.header.timestamp),
                        });
                    }
                    missedCounts.set(baker, newCount);
                }
                if (!lastBlockCycle || blockCycle > lastBlockCycle) {
                    for (const baker of bakers) {
                        try {
                            const delegateInfo = await rpc.getDelegate(baker);
                            const deactivationEvent = (0, exports.checkForDeactivations)({
                                baker,
                                cycle: blockCycle,
                                delegateInfo,
                                threshold: atRiskThreshold,
                            });
                            if (deactivationEvent)
                                events.push(deactivationEvent);
                        }
                        catch (err) {
                            if (err instanceof util_1.HttpResponseError) {
                                if (err.nodeErrors.some((x) => x.id.endsWith("delegate.not_registered"))) {
                                    log.error(`Delegate ${baker} is not registered`);
                                }
                            }
                            else {
                                log.error(err);
                            }
                        }
                    }
                }
                else {
                    log.debug(`Not checking deactivations as this cycle (${blockCycle}) was already checked`);
                }
                log.debug(`About to post ${events.length} baking events`, format.aggregateByBaker(events));
                for (const event of events) {
                    await onEvent(event);
                    if ("level" in event &&
                        enableHistory &&
                        event.kind !== events_1.Events.BakerRecovered &&
                        event.kind !== events_1.Events.BakerUnhealthy) {
                        await addToHistory(event);
                    }
                }
                log.debug(`About to post ${bakerHealthEvents.length} baker health events`, format.aggregateByBaker(bakerHealthEvents));
                for (const event of bakerHealthEvents) {
                    await onEvent(event);
                }
                await setPosition({
                    blockLevel: currentLevel,
                    blockCycle,
                    cyclePosition,
                });
                currentLevel++;
                lastBlockCycle = blockCycle;
                await (0, delay_1.delay)(1000);
            }
        }
        catch (err) {
            if (err.name === "HttpRequestFailed") {
                log.warn("RPC Error:", err.message);
            }
            else {
                log.warn("RPC Error:", err);
            }
        }
    };
    const interval = 1000 * (parseInt(constants.minimal_block_delay) || 30);
    const srv = service.create(name, task, interval);
    const info = async () => {
        const chainPosition = await getPosition();
        const bakers = await getMonitoredAddresses(chainPosition);
        const lastBlockLevel = chainPosition.blockLevel;
        const lastBlockCycle = chainPosition.blockCycle;
        const cyclePosition = chainPosition.cyclePosition || 0;
        const bakerInfo = [];
        for (const baker of bakers) {
            const bakerEventLog = await getBakerEventLog(baker);
            bakerInfo.push({
                address: baker,
                recentEvents: async () => {
                    const recentEvents = [];
                    for await (const record of bakerEventLog.readFrom(-MAX_HISTORY)) {
                        recentEvents.push(record.value);
                    }
                    return recentEvents;
                },
            });
        }
        return {
            bakerInfo,
            lastProcessed: lastBlockLevel > 0
                ? { level: lastBlockLevel, cycle: lastBlockCycle, cyclePosition }
                : undefined,
            headDistance,
            blocksPerCycle: constants.blocks_per_cycle,
            atRiskThreshold,
        };
    };
    return {
        name: srv.name,
        start: srv.start,
        stop: srv.stop,
        info,
    };
};
exports.create = create;
const checkForDeactivations = ({ baker, cycle, delegateInfo, threshold, }) => {
    const log = (0, loglevel_1.getLogger)(name);
    const createdAt = (0, now_1.default)();
    if (delegateInfo.deactivated) {
        log.debug(`Baker ${baker} is deactivated (on or before cycle ${cycle})`);
        return {
            kind: events_1.Events.Deactivated,
            baker,
            cycle,
            createdAt,
        };
    }
    else if (delegateInfo.grace_period - cycle <= threshold) {
        log.debug(`Baker ${baker} is scheduled for deactivation in cycle ${delegateInfo.grace_period}`);
        return {
            kind: events_1.Events.DeactivationRisk,
            baker,
            cycle: delegateInfo.grace_period,
            createdAt,
        };
    }
    else {
        const message = `Baker ${baker} is not at risk of deactivation`;
        log.debug(message);
    }
    return null;
};
exports.checkForDeactivations = checkForDeactivations;
function* checkHealth(events, missedEventsThreshold, missedCounts) {
    for (const { baker, kind } of events) {
        const count = missedCounts.get(baker) || 0;
        if (missedKinds.has(kind)) {
            const newCount = count + 1;
            yield {
                event: newCount === missedEventsThreshold
                    ? events_1.Events.BakerUnhealthy
                    : undefined,
                baker,
                newCount,
            };
        }
        else if (successKinds.has(kind) && count > 0) {
            yield {
                event: count >= missedEventsThreshold ? events_1.Events.BakerRecovered : undefined,
                baker,
                newCount: 0,
            };
        }
    }
}
exports.checkHealth = checkHealth;
