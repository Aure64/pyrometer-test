import { Router } from "express";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

export type HealthState = {
  lastBlockLevel: number | null;
  lastBlockTimestamp: Date | null;
  rpcReachable: boolean;
  startedAt: Date;
};

const state: HealthState = {
  lastBlockLevel: null,
  lastBlockTimestamp: null,
  rpcReachable: true,
  startedAt: new Date(),
};

export const updateHealth = (updates: Partial<HealthState>) => {
  Object.assign(state, updates);
};

const router = Router();

router.get("/health", (_req, res) => {
  const uptime = Math.floor((Date.now() - state.startedAt.getTime()) / 1000);
  const status =
    state.rpcReachable && state.lastBlockLevel !== null ? "ok" : "degraded";

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
  } else {
    res.status(503).json({ ready: false });
  }
});

export default router;
