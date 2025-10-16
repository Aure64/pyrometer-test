"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const loglevel_1 = require("loglevel");
const delay_1 = require("./delay");
const create = (name, task, interval = 60 * 1e3) => {
    const log = (0, loglevel_1.getLogger)(name);
    let count = 0;
    let shouldRun = true;
    let currentDelay;
    const isInterrupted = () => !shouldRun;
    const start = async () => {
        log.info(`starting at interval ${interval}ms ...`);
        try {
            while (shouldRun) {
                count++;
                const t0 = new Date().getTime();
                log.debug(`starting iteration ${count}`);
                await task(isInterrupted);
                const dt = new Date().getTime() - t0;
                log.debug(`iteration ${count} done in ${dt} ms`);
                if (!shouldRun)
                    break;
                currentDelay = (0, delay_1.delay2)(interval);
                await currentDelay.promise;
            }
        }
        catch (err) {
            if (err instanceof delay_1.CancelledError) {
                log.info(`stopped`);
            }
            else {
                log.error(`unexpected error`, err);
            }
        }
    };
    const stop = () => {
        log.info(`stopping...`);
        shouldRun = false;
        currentDelay?.cancel();
    };
    return {
        name,
        start,
        stop,
    };
};
exports.create = create;
