"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports.app = void 0;
const path_1 = require("path");
const express_1 = __importDefault(require("express"));
const express_graphql_1 = require("express-graphql");
const schema_1 = require("./schema");
const context_1 = require("./context");
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const loglevel_1 = require("loglevel");
exports.app = (0, express_1.default)();
const logFormat = process.env.NODE_ENV === "development" ? "dev" : "combined";
exports.app.use((0, morgan_1.default)(logFormat, process.env.NODE_ENV === "development"
    ? undefined
    : {
        skip: function (_req, res) {
            return res.statusCode < 400;
        },
    }));
exports.app.use((0, cors_1.default)());
const rootValue = {
    hello: () => {
        return "Hello world!";
    },
};
const start = (nodeMonitor, bakerMonitor, rpc, { host, port, explorer_url, webroot: configuredWebroot, show_system_info, alias: aliasMap, }, rpcConfig) => {
    console.error("show_system_info", show_system_info);
    const webroot = configuredWebroot || (0, path_1.join)(__dirname, "../../ui");
    (0, loglevel_1.getLogger)("api").info(`Serving web UI assets from ${webroot}`);
    exports.app.use(express_1.default.static(webroot));
    exports.app.use("/gql", (0, express_graphql_1.graphqlHTTP)({
        schema: schema_1.schema,
        rootValue,
        graphiql: true,
        context: (0, context_1.createContext)(nodeMonitor || { info: async () => [] }, bakerMonitor || {
            info: async () => {
                return {
                    bakerInfo: [],
                    headDistance: 0,
                    blocksPerCycle: 0,
                    atRiskThreshold: 1,
                };
            },
        }, rpc, rpcConfig, explorer_url, show_system_info, aliasMap),
    }));
    return exports.app.listen(port, host, () => {
        const logger = (0, loglevel_1.getLogger)("api");
        logger.info(`Server started on ${host}:${port}`);
    });
};
exports.start = start;
