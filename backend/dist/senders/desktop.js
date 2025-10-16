"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const node_notifier_1 = require("node-notifier");
const format_1 = __importDefault(require("../format"));
const events_1 = require("../events");
const post = async (message, sound) => {
    return new Promise((resolve, reject) => {
        (0, node_notifier_1.notify)({
            title: "Pyrometer",
            message,
            sound,
        }, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
const create = (config) => {
    return (0, events_1.FilteredSender)(async (events) => {
        //doesn't support multiline messages, must post one by one
        const lines = (0, format_1.default)(events, config.emoji, config.short_address, false, config.alias);
        for (const line of lines) {
            await post(line, config.enableSound);
        }
    }, config);
};
exports.create = create;
