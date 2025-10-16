"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.startTestEndpoint = void 0;
const http_1 = require("http");
const loglevel_1 = require("loglevel");
const util_1 = require("../rpc/util");
const startTestEndpoint = (port) => {
    const log = (0, loglevel_1.getLogger)("webhook-test");
    const server = (0, http_1.createServer)((req, res) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
        });
        req.on("end", () => {
            log.info(req.headers);
            log.info(JSON.parse(data));
            res.end();
        });
    });
    return server.listen(port);
};
exports.startTestEndpoint = startTestEndpoint;
const create = (config) => {
    if (config.test_endpoint_port) {
        (0, exports.startTestEndpoint)(config.test_endpoint_port);
    }
    const requestTimeout = config.request_timeout * 1e3;
    const log = (0, loglevel_1.getLogger)("http-sender");
    return async (events) => {
        const url = config.url;
        const method = "POST";
        const body = JSON.stringify(events);
        const headers = {
            "Content-Type": "application/json",
            "User-Agent": config.user_agent,
        };
        const result = await (0, util_1.fetchTimeout)(url, requestTimeout, {
            body,
            method,
            headers,
        });
        if (!result.ok) {
            log.error(result);
            throw new Error(result.statusText);
        }
    };
};
exports.create = create;
