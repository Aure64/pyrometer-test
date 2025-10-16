"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const webhook_1 = require("@slack/webhook");
const events_1 = require("../events");
const format_1 = __importDefault(require("../format"));
const lodash_1 = require("lodash");
const create = (config) => {
    const webhook = new webhook_1.IncomingWebhook(config.url);
    return (0, events_1.FilteredSender)(async (events) => {
        const lines = (0, format_1.default)(events, config.emoji, config.short_address, false, config.alias);
        //slack splits large text into multiple messages automatically
        //but in doing so it breaks markup (markup beginning in one message,
        //markup and in another), so we have to chunk it ourselves
        const chunks = (0, lodash_1.chunk)(lines, 20);
        for (const chunk of chunks) {
            const text = chunk.join("\n");
            await webhook.send("```\n" + text + "\n```");
        }
    }, config);
};
exports.create = create;
