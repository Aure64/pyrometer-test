"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBootstrappedStatus = exports.getTezosVersion = exports.getNetworkConnections = void 0;
const loglevel_1 = require("loglevel");
const delay_1 = require("../delay");
const lru_cache_1 = require("lru-cache");
const memoization_1 = require("../memoization");
const util_1 = require("./util");
const util_2 = require("./util");
const util_3 = require("./util");
const urls_1 = require("./urls");
const urls_2 = require("./urls");
const urls_3 = require("./urls");
const urls_4 = require("./urls");
const urls_5 = require("./urls");
const urls_6 = require("./urls");
const urls_7 = require("./urls");
const urls_8 = require("./urls");
const urls_9 = require("./urls");
const urls_10 = require("./urls");
const urls_11 = require("./urls");
const urls_12 = require("./urls");
const urls_13 = require("./urls");
const urls_14 = require("./urls");
const getNetworkConnections = async (node) => {
    return (await (0, util_1.get)(`${node}/${urls_1.E_NETWORK_CONNECTIONS}`));
};
exports.getNetworkConnections = getNetworkConnections;
const getTezosVersion = async (node) => {
    return (await (0, util_1.get)(`${node}/${urls_2.E_TEZOS_VERSION}`));
};
exports.getTezosVersion = getTezosVersion;
const getBootstrappedStatus = async (node) => {
    return (await (0, util_1.get)(`${node}/${urls_3.E_IS_BOOTSTRAPPED}`));
};
exports.getBootstrappedStatus = getBootstrappedStatus;
const F_FROZEN_DEPOSITS = "frozen_deposits";
const F_FROZEN_BALANCE = "frozen_balance";
const F_BALANCE = "balance";
const F_FULL_BALANCE = "full_balance";
exports.default = (nodeRpcUrl, { retry_interval_ms: retryIntervalMs, retry_attempts: retryAttempts, }) => {
    const retry404 = (apiCall) => {
        return (0, util_2.retry404)(apiCall, retryIntervalMs, retryAttempts);
    };
    const getEndorsingRights = async (node, block, level) => {
        const params = { level: level.toString() };
        return retry404(() => (0, util_1.get)(`${node}/${(0, urls_4.E_ENDORSING_RIGHTS)(block, params)}`));
    };
    const getBakingRights = async (node, block, level, max_priority, delegate) => {
        const params = { level: level.toString() };
        if (level !== undefined) {
            params.level = level.toString();
        }
        if (max_priority !== undefined) {
            params.max_priority = max_priority.toString();
            params.max_round = params.max_priority; //renamed in Ithaca
        }
        if (delegate !== undefined) {
            params.delegate = delegate;
        }
        return retry404(() => (0, util_1.get)(`${node}/${(0, urls_5.E_BAKING_RIGHTS)(block, params)}`));
    };
    const getConstants = async (node) => {
        return (await (0, util_1.get)(`${node}/${(0, urls_6.E_CONSTANTS)("head")}`));
    };
    const getChainId = async (node) => {
        return (await (0, util_1.get)(`${node}/${urls_7.E_CHAIN_ID}`));
    };
    const getBlock = async (node, block) => {
        return retry404(() => (0, util_1.get)(`${node}/${(0, urls_8.E_BLOCK)(block)}`));
    };
    const getBlockHash = async (node, block) => {
        return retry404(() => (0, util_1.get)(`${node}/${(0, urls_10.E_BLOCK_HASH)(block)}`));
    };
    const _getBlockHeader = async (node, block) => {
        return retry404(() => (0, util_1.get)(`${node}/${(0, urls_9.E_BLOCK_HEADER)(block)}`));
    };
    const getBlockHeader = (0, memoization_1.makeMemoizedAsyncFunction)((nodeRpcUrl, block) => {
        return _getBlockHeader(nodeRpcUrl, block);
    }, (_nodeRpcUrl, block) => block.toLowerCase().startsWith("head") ? null : block, 10);
    const getDelegate = async (node, pkh, block) => {
        return (await (0, util_1.get)(`${node}/${(0, urls_11.E_DELEGATES_PKH)(block, pkh)}`));
    };
    const getParticipation = async (node, pkh, block) => {
        return (await (0, util_1.get)(`${node}/${(0, urls_12.E_DELEGATE_PARTICIPATION)(block, pkh)}`));
    };
    const log = (0, loglevel_1.getLogger)("rpc");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegateCache = new lru_cache_1.LRUCache({
        max: 5 * 25,
        ttl: 60e3,
    });
    const fetchDelegateField = async (pkh, block, field) => {
        const cacheKey = `${block}:${pkh}:${field}`;
        let value = delegateCache.get(cacheKey);
        if (value === undefined) {
            //when status UI page loads/refreshes, GraphQL results in a lot
            //of requests going out at the same time, up to number of bakers
            //on page times 5 delegate fields if server just started and
            //cache is empty... need to spread out these requests a bit,
            //otherwise some nodes are not able to handle it
            const d = 200 * Math.random();
            log.debug("Random delay", d);
            await (0, delay_1.delay)(d);
            const dt = Date.now();
            value = await (0, util_1.get)(`${(0, urls_14.delegatesUrl)(nodeRpcUrl, pkh, block)}/${field}`);
            log.debug(`got value for ${cacheKey} in ${Date.now() - dt}`);
            //cache requests using block id relative to head for a few
            //minutes, with different ttls so avoid request bursts when they
            //all expire at the same time this means displayed balances may
            //be slightly stale
            delegateCache.set(cacheKey, value, {
                ttl: 60e3 * (1 + 3 * Math.random()),
            });
        }
        else {
            log.debug(`CACHE HIT: '${value}' under ${cacheKey} (${delegateCache.size} items cached)`);
        }
        return value;
    };
    const tezosVersionCache = new lru_cache_1.LRUCache({
        max: 1,
        ttl: 5 * 60e3,
    });
    const fetchTezosVersion = async () => {
        let tezosVersion = tezosVersionCache.get("value");
        if (!tezosVersion) {
            tezosVersion = await (0, exports.getTezosVersion)(nodeRpcUrl);
            tezosVersionCache.set("value", tezosVersion);
        }
        return tezosVersion;
    };
    const fetchBlockHeaders = async (node, blockHash, length) => {
        const history = [];
        let nextHash = blockHash;
        // very primitive approach: we simply iterate up our chain to find the most recent blocks
        while (history.length < length) {
            const header = await getBlockHeader(node, nextHash);
            nextHash = header.predecessor;
            history.push(header);
        }
        return history;
    };
    //try Ithaca endpoint first
    let frozenDepositsFields = [F_FROZEN_DEPOSITS, F_FROZEN_BALANCE];
    let fullBalanceFields = [F_FULL_BALANCE, F_BALANCE];
    const getActiveBakers = async (node, block) => {
        return (await (0, util_1.get)(`${node}/${(0, urls_13.E_ACTIVE_DELEGATES)(block)}`));
    };
    return {
        url: nodeRpcUrl,
        getTezosVersion: fetchTezosVersion,
        getBootsrappedStatus: () => (0, exports.getBootstrappedStatus)(nodeRpcUrl),
        getNetworkConnections: () => (0, exports.getNetworkConnections)(nodeRpcUrl),
        getEndorsingRights: (block, level) => {
            return getEndorsingRights(nodeRpcUrl, block, level);
        },
        getBakingRights: (block, level, max_priority, delegate) => {
            return getBakingRights(nodeRpcUrl, block, level, max_priority, delegate);
        },
        getConstants: () => getConstants(nodeRpcUrl),
        getBlockHeader: (0, memoization_1.makeMemoizedAsyncFunction)((block) => {
            return getBlockHeader(nodeRpcUrl, block);
        }, (block) => block.toLowerCase().startsWith("head") ? null : block, 10),
        getBlock: (block = "head") => {
            return getBlock(nodeRpcUrl, block);
        },
        getBlockHash: (block = "head") => {
            return getBlockHash(nodeRpcUrl, block);
        },
        getBlockHistory: (blockHash, length = 5) => {
            return fetchBlockHeaders(nodeRpcUrl, blockHash, length);
        },
        //.../balance renamed .../full_balance in Ithaca
        getFullBalance: async (pkh, block = "head") => {
            try {
                return await fetchDelegateField(pkh, block, fullBalanceFields[0]);
            }
            catch (err) {
                if (err instanceof util_3.HttpResponseError && err.status === 404) {
                    log.info(`Got 404 for ${fullBalanceFields[0]}, switching to ${fullBalanceFields[1]}`);
                    const result = await fetchDelegateField(pkh, block, fullBalanceFields[1]);
                    fullBalanceFields = [...fullBalanceFields].reverse();
                    return result;
                }
            }
        },
        //.../frozen_balance renamed .../frozen_deposits in Ithaca
        getFrozenDeposits: async (pkh, block = "head") => {
            try {
                return await fetchDelegateField(pkh, block, frozenDepositsFields[0]);
            }
            catch (err) {
                if (err instanceof util_3.HttpResponseError && err.status === 404) {
                    log.info(`Got 404 for ${frozenDepositsFields[0]}, switching to ${frozenDepositsFields[1]}`);
                    const result = await fetchDelegateField(pkh, block, frozenDepositsFields[1]);
                    frozenDepositsFields = [...frozenDepositsFields].reverse();
                    return result;
                }
            }
        },
        getStakingBalance: (pkh, block = "head") => {
            return fetchDelegateField(pkh, block, "staking_balance");
        },
        getGracePeriod: (pkh, block = "head") => {
            return fetchDelegateField(pkh, block, "grace_period");
        },
        getDeactivated: (pkh, block = "head") => {
            return fetchDelegateField(pkh, block, "deactivated");
        },
        getDelegate: (pkh, block = "head") => {
            return getDelegate(nodeRpcUrl, pkh, block);
        },
        getParticipation: (pkh, block = "head") => {
            return getParticipation(nodeRpcUrl, pkh, block);
        },
        getConsensusKey: async (pkh, block = "head") => {
            try {
                return await fetchDelegateField(pkh, block, "consensus_key");
            }
            catch (err) {
                if (err instanceof util_3.HttpResponseError && err.status === 404) {
                    log.debug(`Got ${err.status} from ${err.url}`);
                }
                return Promise.resolve(null);
            }
        },
        getChainId: () => getChainId(nodeRpcUrl),
        getRights: async (level, maxRoundOrPriority) => {
            const blockId = `${level}`;
            const bakingRightsPromise = getBakingRights(nodeRpcUrl, blockId, level, maxRoundOrPriority);
            const endorsingRightsPromise = getEndorsingRights(nodeRpcUrl, blockId, level - 1);
            const [bakingRights, endorsingRights] = await Promise.all([
                bakingRightsPromise,
                endorsingRightsPromise,
            ]);
            return [bakingRights, endorsingRights];
        },
        getActiveBakers: async (block = "head") => {
            return getActiveBakers(nodeRpcUrl, block);
        },
    };
};
