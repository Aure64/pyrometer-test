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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = void 0;
const loglevel_1 = require("loglevel");
const loglevel_2 = __importDefault(require("loglevel"));
const prefix = __importStar(require("loglevel-plugin-prefix"));
const date_fns_1 = require("date-fns");
const chalk_1 = __importDefault(require("chalk"));
const setup = (config) => {
    console.log("Logging config", config);
    const colors = {
        TRACE: chalk_1.default.magenta,
        DEBUG: chalk_1.default.cyan,
        INFO: chalk_1.default.blue,
        WARN: chalk_1.default.yellow,
        ERROR: chalk_1.default.red,
    };
    const colorizeLevel = (level) => {
        const color = colors[level.toUpperCase()] || chalk_1.default.black;
        return color(level[0]);
    };
    // Register prefix plug with loglevel.  This adds timestamp and level to logs.
    const logger = loglevel_2.default.noConflict();
    prefix.reg(logger);
    if (config.timestamp) {
        const timestampFormatter = (date) => (0, date_fns_1.format)(date, "yyyy-MM-dd H:mm:ss");
        prefix.apply(logger, { timestampFormatter });
    }
    // colorize output
    prefix.apply(loglevel_2.default, {
        format(level, name, timestamp) {
            return `${config.timestamp ? chalk_1.default.gray(`${timestamp}`) + " " : ""}${colorizeLevel(level)} [${name}]`;
        },
    });
    for (const key in config) {
        const subLoggerConf = config[key];
        if (subLoggerConf.level) {
            loglevel_2.default.getLogger(key).setLevel(subLoggerConf.level);
        }
    }
    (0, loglevel_1.setLevel)(config.level);
};
exports.setup = setup;
