"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const events_1 = require("../events");
const format_1 = __importDefault(require("../format"));
const lodash_1 = require("lodash");
const loglevel_1 = require("loglevel");
const log = (0, loglevel_1.getLogger)("discord");
const colorFor = (kind) => {
    switch (kind) {
        case events_1.Events.BakerUnhealthy:
            return 0xe74c3c; // red
        case events_1.Events.BakerRecovered:
            return 0x2ecc71; // green
        case events_1.Events.MissedBake:
        case events_1.Events.MissedEndorsement:
        case events_1.Events.MissedBonus:
            return 0xe67e22; // orange
        case events_1.Events.DeactivationRisk:
        case events_1.Events.Deactivated:
            return 0xc0392b; // dark red
        default:
            return 0x95a5a6; // gray
    }
};
const formatOne = (event, config) => {
    const [line] = (0, format_1.default)([event], config.emoji, config.short_address, false, config.alias);
    const title = "kind" in event ? String(event.kind) : "event";
    return {
        title,
        description: line ?? title,
        color: colorFor(event.kind ?? events_1.Events.Notification),
    };
};
const postWithRetry = async (url, body, maxRetries = 3) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        });
        if (res.status === 429) {
            const retryAfter = Number(res.headers.get("retry-after") ?? "1");
            log.warn(`discord 429, waiting ${retryAfter}s`);
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            continue;
        }
        if (!res.ok) {
            throw new Error(`discord webhook returned ${res.status}`);
        }
        return;
    }
    throw new Error("discord webhook: max retries exceeded after 429s");
};
const create = (config) => {
    return (0, events_1.FilteredSender)(async (events) => {
        if (events.length === 0)
            return;
        const embeds = events.map((e) => formatOne(e, config));
        for (const batch of (0, lodash_1.chunk)(embeds, 10)) {
            const body = { embeds: batch };
            if (config.username)
                body.username = config.username;
            await postWithRetry(config.url, body);
        }
    }, config);
};
exports.create = create;
