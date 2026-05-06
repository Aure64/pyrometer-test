"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHealth = void 0;
const express_1 = require("express");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");
const state = {
    lastBlockLevel: null,
    lastBlockTimestamp: null,
    rpcReachable: true,
    startedAt: new Date(),
};
const updateHealth = (updates) => {
    Object.assign(state, updates);
};
exports.updateHealth = updateHealth;
const router = (0, express_1.Router)();
router.get("/health", (_req, res) => {
    const uptime = Math.floor((Date.now() - state.startedAt.getTime()) / 1000);
    const status = state.rpcReachable && state.lastBlockLevel !== null ? "ok" : "degraded";
    res.status(status === "ok" ? 200 : 503).json({
        status,
        version,
        uptime,
        lastBlock: state.lastBlockLevel
            ? { level: state.lastBlockLevel, timestamp: state.lastBlockTimestamp }
            : null,
        rpcReachable: state.rpcReachable,
    });
});
router.get("/ready", (_req, res) => {
    if (state.lastBlockLevel !== null && state.rpcReachable) {
        res.status(200).json({ ready: true });
    }
    else {
        res.status(503).json({ ready: false });
    }
});
exports.default = router;
