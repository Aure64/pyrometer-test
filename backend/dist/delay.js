"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay2 = exports.CancelledError = exports.delay = void 0;
const loglevel_1 = require("loglevel");
const delay = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
exports.delay = delay;
class CancelledError extends Error {
}
exports.CancelledError = CancelledError;
const delay2 = (milliseconds) => {
    let cancel = () => {
        (0, loglevel_1.debug)("dummy delay cancel invoked, no op");
    };
    const promise = new Promise((resolve, reject) => {
        const timeoutHandle = setTimeout(resolve, milliseconds);
        cancel = () => {
            clearTimeout(timeoutHandle);
            reject(new CancelledError());
        };
    });
    return { promise, cancel };
};
exports.delay2 = delay2;
