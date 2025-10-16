"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.fetchTimeout = exports.HttpResponseError = exports.tryForever = exports.retry404 = void 0;
const delay_1 = require("../delay");
const loglevel_1 = require("loglevel");
const node_fetch_1 = __importDefault(require("node-fetch"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const retry404 = async (apiCall, interval, maxAttempts) => {
    let attempts = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        attempts++;
        try {
            return await apiCall();
        }
        catch (err) {
            if (attempts > maxAttempts) {
                throw err;
            }
            if (err instanceof HttpResponseError && err.status === 404) {
                (0, loglevel_1.getLogger)("rpc").warn(`Got ${err.status} from ${err.url}, retrying in ${interval}ms [attempt ${attempts} of ${maxAttempts}]`);
                await (0, delay_1.delay)(interval);
            }
            else {
                throw err;
            }
        }
    }
};
exports.retry404 = retry404;
const tryForever = async (call, interval, label = "") => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await call();
        }
        catch (err) {
            (0, loglevel_1.getLogger)("rpc").warn(`${label} failed, will retry in ${interval} ms`, err);
            await (0, delay_1.delay)(interval);
        }
    }
};
exports.tryForever = tryForever;
class HttpResponseError extends Error {
    constructor(message, status, statusText, url, nodeErrors) {
        super(message);
        this.message = message;
        this.status = status;
        this.statusText = statusText;
        this.url = url;
        this.name = "HttpResponseError";
        this.nodeErrors = nodeErrors;
    }
}
exports.HttpResponseError = HttpResponseError;
const httpAgent = new http_1.default.Agent({
    keepAlive: false,
});
const httpsAgent = new https_1.default.Agent({
    keepAlive: false,
});
const agentSelector = (_parsedURL) => {
    if (_parsedURL.protocol == "http:") {
        return httpAgent;
    }
    else {
        return httpsAgent;
    }
};
// https://stackoverflow.com/questions/46946380/fetch-api-request-timeout/57888548#57888548
const fetchTimeout = (url, ms, options) => {
    const controller = new AbortController();
    const promise = (0, node_fetch_1.default)(url, {
        //https://github.com/node-fetch/node-fetch/issues/1652
        signal: controller.signal,
        agent: agentSelector,
        ...options,
    });
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.finally(() => clearTimeout(timeout));
};
exports.fetchTimeout = fetchTimeout;
const get = async (url) => {
    const t0 = new Date().getTime();
    const response = await (0, exports.fetchTimeout)(url, 30e3);
    const dt = new Date().getTime() - t0;
    (0, loglevel_1.getLogger)("rpc").debug(`|> ${url} in ${dt} ms`);
    if (response.ok) {
        return response.json();
    }
    let nodeErrors = [];
    if (response.status === 500) {
        try {
            nodeErrors = (await response.json()) || [];
        }
        catch (err) {
            (0, loglevel_1.getLogger)("rpc").error(`|> 500 ${url} could not get error response content`);
        }
    }
    throw new HttpResponseError(`${response.status} ${url}`, response.status, response.statusText, url, nodeErrors);
};
exports.get = get;
