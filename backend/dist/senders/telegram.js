"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const loglevel_1 = require("loglevel");
const events_1 = require("../events");
const format_1 = __importDefault(require("../format"));
const delay_1 = require("../delay");
const storage_1 = require("../storage");
const LOGGER_NAME = "telegram-sender";
const MAX_MESSAGE_LENGTH = 4096;
/**
 * Fetch chatId for the given token. Telegram expires updates after 24 hours, so the chat must
 * have had activity during this time to succeed.
 * Times out with a failure after 20 seconds.
 */
const listenForChatId = async (token) => {
    return new Promise((resolve, reject) => {
        const bot = new node_telegram_bot_api_1.default(token, { polling: true });
        const timeout = setTimeout(() => {
            bot.stopPolling();
            reject(new Error("No telegram messages received for provided token."));
        }, 20000);
        bot.on("message", (message) => {
            bot.stopPolling();
            const chatId = message.chat.id;
            clearTimeout(timeout);
            resolve(chatId);
        });
    });
};
const create = async (config, storageDir) => {
    const log = (0, loglevel_1.getLogger)(LOGGER_NAME);
    const bot = new node_telegram_bot_api_1.default(config.token);
    const store = await (0, storage_1.open)([storageDir, "telegram"]);
    const CHAT_ID_KEY = "chat-id";
    const getChatId = async () => (await store.get(CHAT_ID_KEY));
    const setChatId = async (value) => await store.put(CHAT_ID_KEY, value);
    let chatId = await getChatId();
    log.info(`Telegram chat id: ${chatId}`);
    if (!chatId) {
        log.info(`No Telegram chat id , attempting to fetch...`);
        log.info(`Send any message to your bot in Telegram`);
        try {
            chatId = await listenForChatId(config.token);
            setChatId(chatId);
            log.info(`Fetched Telegram chat id: ${chatId}`);
        }
        catch (err) {
            log.error(`Unable to fetch Telegram chatId for token ${config.token}`, err);
        }
    }
    return (0, events_1.FilteredSender)(async (events) => {
        if (!chatId) {
            throw new Error("Telegram notification channel is missing chatId");
        }
        const lines = (0, format_1.default)(events, config.emoji, config.short_address, false, config.alias);
        let message = "";
        let count = 0;
        for (const line of lines) {
            if (message.length + line.length + 1 < MAX_MESSAGE_LENGTH) {
                message += line + "\n";
            }
            else {
                count += 1;
                log.debug(`Sending message ${count} of length ${message.length}`, message);
                await bot.sendMessage(chatId, `<pre>${message}</pre>`, {
                    parse_mode: "HTML",
                });
                message = line + "\n";
                await (0, delay_1.delay)(1000);
            }
        }
        if (message.length > 0) {
            count += 1;
            log.debug(`Sending message ${count} of length ${message.length}`, message);
            await bot.sendMessage(chatId, `<pre>${message}</pre>`, {
                parse_mode: "HTML",
            });
        }
    }, config);
};
exports.create = create;
