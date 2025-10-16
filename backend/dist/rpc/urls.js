"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegatesUrl = exports.E_ACTIVE_DELEGATES = exports.E_DELEGATE_PARTICIPATION = exports.E_DELEGATES_PKH = exports.E_CHAIN_ID = exports.E_ENDORSING_RIGHTS = exports.E_BAKING_RIGHTS = exports.E_BLOCK_HASH = exports.E_BLOCK_HEADER = exports.E_BLOCK = exports.E_CONSTANTS = exports.E_IS_BOOTSTRAPPED = exports.E_TEZOS_VERSION = exports.E_NETWORK_CONNECTIONS = void 0;
const url_1 = require("url");
exports.E_NETWORK_CONNECTIONS = "network/connections";
exports.E_TEZOS_VERSION = "version";
exports.E_IS_BOOTSTRAPPED = "chains/main/is_bootstrapped";
const E_CONSTANTS = (block) => `chains/main/blocks/${block}/context/constants`;
exports.E_CONSTANTS = E_CONSTANTS;
const E_BLOCK = (block) => `chains/main/blocks/${block}`;
exports.E_BLOCK = E_BLOCK;
const E_BLOCK_HEADER = (block) => `chains/main/blocks/${block}/header`;
exports.E_BLOCK_HEADER = E_BLOCK_HEADER;
const E_BLOCK_HASH = (block) => `chains/main/blocks/${block}/hash`;
exports.E_BLOCK_HASH = E_BLOCK_HASH;
const E_BAKING_RIGHTS = (block, params) => {
    const path = `chains/main/blocks/${block}/helpers/baking_rights`;
    return `${path}?${new url_1.URLSearchParams(params).toString()}`;
};
exports.E_BAKING_RIGHTS = E_BAKING_RIGHTS;
const E_ENDORSING_RIGHTS = (block, params) => {
    const path = `chains/main/blocks/${block}/helpers/attestation_rights`;
    return `${path}?${new url_1.URLSearchParams(params).toString()}`;
};
exports.E_ENDORSING_RIGHTS = E_ENDORSING_RIGHTS;
exports.E_CHAIN_ID = "chains/main/chain_id";
const E_DELEGATES_PKH = (block, pkh) => `chains/main/blocks/${block}/context/delegates/${pkh}`;
exports.E_DELEGATES_PKH = E_DELEGATES_PKH;
const E_DELEGATE_PARTICIPATION = (block, pkh) => `chains/main/blocks/${block}/context/delegates/${pkh}/participation`;
exports.E_DELEGATE_PARTICIPATION = E_DELEGATE_PARTICIPATION;
const E_ACTIVE_DELEGATES = (block) => `chains/main/blocks/${block}/context/delegates?active`;
exports.E_ACTIVE_DELEGATES = E_ACTIVE_DELEGATES;
const delegatesUrl = (rpcUrl, pkh, block) => {
    return `${rpcUrl}/${(0, exports.E_DELEGATES_PKH)(block, pkh)}`;
};
exports.delegatesUrl = delegatesUrl;
