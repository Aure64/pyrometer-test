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
exports.create = void 0;
const loglevel_1 = require("loglevel");
const service = __importStar(require("./service"));
const storage = __importStar(require("./storage"));
const create = async (name, send, storageDirectory, eventLog, { max_batch_size: maxBatchSize, ttl, interval }) => {
    const log = (0, loglevel_1.getLogger)(name);
    const store = await storage.open([storageDirectory, "consumers"]);
    const readPosition = async () => (await store.get(name, -1));
    const writePosition = async (value) => await store.put(name, value);
    const task = async () => {
        const batch = [];
        let position = await readPosition();
        log.debug(`reading from position ${position}`);
        for await (const record of eventLog.readFrom(position + 1)) {
            const event = record.value;
            if (Date.now() - event.createdAt.getTime() > 1e3 * ttl) {
                log.info(`Skipping event (expired)`, record);
            }
            else {
                batch.push(event);
            }
            position = record.position;
            if (batch.length === maxBatchSize)
                break;
        }
        log.debug(`read batch of ${batch.length}, last position ${position}`);
        if (batch.length > 0) {
            try {
                await send(batch);
                await writePosition(position);
            }
            catch (err) {
                log.error(`could not send`, err);
            }
        }
    };
    const srv = service.create(name, task, interval * 1e3);
    return {
        name,
        start: srv.start,
        stop: srv.stop,
        position: readPosition,
    };
};
exports.create = create;
