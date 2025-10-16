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
exports.gc = exports.open = void 0;
const loglevel_1 = require("loglevel");
const storage = __importStar(require("./storage"));
const service = __importStar(require("./service"));
const open = async (storageDir, topic = "eventlog", maxSize = Number.MAX_SAFE_INTEGER, logName = "eventlog") => {
    const store = await storage.open([storageDir, topic]);
    const log = (0, loglevel_1.getLogger)(logName);
    const logPrefix = logName === topic ? "" : `<${topic}> `;
    const SEQ_KEY = "_sequence";
    let sequence = (await store.get(SEQ_KEY, 0));
    const add = async (event) => {
        log.debug(`about to store event ${sequence}`, event);
        const eventPos = sequence;
        store.putSync(eventPos, event);
        const nextSequenceValue = sequence + 1;
        store.putSync(SEQ_KEY, nextSequenceValue);
        sequence = nextSequenceValue;
        const beforeMinPosition = eventPos - maxSize;
        if (beforeMinPosition > -1) {
            await deleteUpTo(beforeMinPosition);
        }
        return { value: event, position: eventPos };
    };
    const read = async (position) => {
        const value = (await store.get(position));
        log.debug(`${logPrefix}got event at ${position}`, value);
        if (value !== null) {
            return { value, position };
        }
        return null;
    };
    const readFrom = async function* (position) {
        let currentPosition = position < 0 ? sequence + position : position;
        while (currentPosition < sequence) {
            const record = await read(currentPosition);
            if (record) {
                yield record;
            }
            currentPosition++;
        }
    };
    const deleteUpTo = async (position) => {
        const keys = (await store.keys()).filter((k) => k !== SEQ_KEY);
        // const fileNames = await fs.promises.readdir(eventsDir);
        const toDelete = keys.filter((name) => parseInt(name) <= position);
        log.debug(`${logPrefix} about to delete ${toDelete.length} keys`, toDelete);
        await Promise.all(toDelete.map(store.remove));
    };
    return {
        add,
        readFrom,
        deleteUpTo,
    };
};
exports.open = open;
const gc = (eventLog, consumers) => {
    const name = "gc";
    const log = (0, loglevel_1.getLogger)(name);
    const task = async () => {
        const positions = await Promise.all(consumers.map((c) => c.position()));
        log.debug(`Consumer positions`, positions);
        const minPosition = Math.min(...positions);
        log.debug(`Min consumer position is ${minPosition}`);
        try {
            await eventLog.deleteUpTo(minPosition);
        }
        catch (err) {
            log.error(err);
        }
    };
    const d = service.create("gc", task, 60 * 1e3);
    return {
        name,
        start: d.start,
        stop: d.stop,
    };
};
exports.gc = gc;
