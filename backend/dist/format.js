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
Object.defineProperty(exports, "__esModule", { value: true });
exports.email = exports.summary = exports.aggregateByBaker = exports.n2superscript = exports.renderNumber = exports.levelRange = exports.formatRange = exports.toString = exports.abbreviateBakerAddress = void 0;
const eventTypes = __importStar(require("./events"));
const events_1 = require("./events");
const lodash_1 = require("lodash");
const date_fns_1 = require("date-fns");
const isBakerEvent = (e) => "baker" in e;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isBlockEvent = (e) => "level" in e;
const nonBakerEvent = (e) => !isBakerEvent(e);
const formatTime = (t) => {
    return (0, date_fns_1.format)(t, "H:mm");
};
const format = (events, useEmoji = false, abbreviateAddress = false, linePerBaker = false, addressAliases = {}) => {
    const bakerEvents = events.filter(isBakerEvent);
    const otherEvents = events.filter(nonBakerEvent);
    const formattedBakerEvents = (0, exports.aggregateByBaker)(bakerEvents, useEmoji, abbreviateAddress, linePerBaker, addressAliases);
    const formattedOtherEvents = otherEvents.map(exports.toString);
    return [...formattedOtherEvents, ...formattedBakerEvents];
};
exports.default = format;
const KindEmojiFormatters = {
    [events_1.Events.MissedBake]: "😡",
    [events_1.Events.MissedBonus]: "😾",
    [events_1.Events.Baked]: "🥖",
    [events_1.Events.DoubleBaked]: "✂️️️️",
    [events_1.Events.MissedEndorsement]: "😕",
    [events_1.Events.Endorsed]: "👍",
    [events_1.Events.DoubleEndorsed]: "‼️️",
    [events_1.Events.DoublePreendorsed]: "‼️️",
    [events_1.Events.NodeBehind]: "🐌",
    [events_1.Events.NodeSynced]: "💫",
    [events_1.Events.NodeLowPeers]: "🤔",
    [events_1.Events.NodeLowPeersResolved]: "🤝",
    [events_1.Events.Deactivated]: "😴",
    [events_1.Events.DeactivationRisk]: "😪",
    [events_1.Events.RpcError]: "⚠️",
    [events_1.Events.RpcErrorResolved]: "✨",
    [events_1.Events.Notification]: "🔔",
    [events_1.Events.BakerUnhealthy]: "🤒",
    [events_1.Events.BakerRecovered]: "💪",
};
const formatKindEmoji = (kind) => KindEmojiFormatters[kind];
const formatKindText = (kind) => kind.replace("_", " ");
const Formatters = {
    [events_1.Events.MissedBake]: (e) => `${e.baker} missed a bake at level ${e.level}`,
    [events_1.Events.MissedBonus]: (e) => `${e.baker} missed a bonus at level ${e.level}`,
    [events_1.Events.Baked]: (e) => `${e.baker} baked block ${e.level}`,
    [events_1.Events.DoubleBaked]: (e) => `${e.baker} double baked block ${e.level}`,
    [events_1.Events.MissedEndorsement]: (e) => `${e.baker} missed endorsement of block ${e.level}`,
    [events_1.Events.Endorsed]: (e) => `${e.baker} endorsed block ${e.level}`,
    [events_1.Events.DoubleEndorsed]: (e) => `${e.baker} double endorsed block ${e.level}`,
    [events_1.Events.DoublePreendorsed]: (e) => `${e.baker} double preendorsed block ${e.level}`,
    [events_1.Events.NodeBehind]: (e) => `[${formatTime(e.createdAt)}] Node ${e.node} is behind`,
    [events_1.Events.NodeSynced]: (e) => `[${formatTime(e.createdAt)}] Node ${e.node} has caught up`,
    [events_1.Events.NodeLowPeers]: (e) => `[${formatTime(e.createdAt)}] ${e.node}: low peer count`,
    [events_1.Events.NodeLowPeersResolved]: (e) => `[${formatTime(e.createdAt)}] ${e.node}: low peer count resolved`,
    [events_1.Events.Deactivated]: (e) => `${e.baker} has been deactivated`,
    [events_1.Events.DeactivationRisk]: (e) => `${e.baker} is at risk of deactivation in cycle ${e.cycle}`,
    [events_1.Events.RpcError]: (e) => `[${formatTime(e.createdAt)}]  Unable to reach ${e.node}: ${e.message}`,
    [events_1.Events.RpcErrorResolved]: (e) => `[${formatTime(e.createdAt)}] Resolved: ${e.node} is reachable again`,
    [events_1.Events.Notification]: (e) => `${e.message}`,
    [events_1.Events.BakerUnhealthy]: (e) => `${e.baker} is unhealthy at level ${e.level}`,
    [events_1.Events.BakerRecovered]: (e) => `${e.baker} is healthy again at level ${e.level}`,
};
const abbreviateBakerAddress = (addr) => `${addr.substr(0, 4)}…${addr.substr(-4)}`;
exports.abbreviateBakerAddress = abbreviateBakerAddress;
const toString = (e) => Formatters[e.kind](e);
exports.toString = toString;
const formatRange = (a, b) => {
    if (!a && !b)
        return "";
    if (a && (!b || b === a))
        return `${a}`;
    if (b && !a)
        return `${b}`;
    let i = 0;
    if (a !== undefined && b !== undefined) {
        const aStr = a.toString();
        const bStr = b.toString();
        while (aStr[i] === bStr[i]) {
            i++;
        }
        const common = aStr.substring(0, i);
        const restA = aStr.substring(i);
        const restB = bStr.substring(i);
        return `${common}[${restA}-${restB}]`;
    }
    return `${a}-${b}`;
};
exports.formatRange = formatRange;
const levelRange = (events) => {
    const sorted = (0, lodash_1.sortBy)(events.filter(isBlockEvent), "level");
    const firstEvent = (0, lodash_1.first)(sorted);
    const lastEvent = (0, lodash_1.last)(sorted);
    const firstLevel = firstEvent && ("level" in firstEvent ? firstEvent.level : undefined);
    const lastLevel = lastEvent && ("level" in lastEvent ? lastEvent.level : undefined);
    return [firstLevel, lastLevel];
};
exports.levelRange = levelRange;
const DIGITS_SUPERSCRIPT = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
};
const renderNumber = (n, digitsMap) => {
    const s = n.toString();
    const result = [];
    for (let i = 0; i < s.length; i++) {
        result.push(digitsMap[s[i]]);
    }
    return result.join("");
};
exports.renderNumber = renderNumber;
const n2superscript = (n) => {
    return (0, exports.renderNumber)(n, DIGITS_SUPERSCRIPT);
};
exports.n2superscript = n2superscript;
const aggregateByBaker = (events, useEmoji = false, abbreviateAddress = false, linePerBaker = false, addressAliases = {}) => {
    const formatKind = useEmoji ? formatKindEmoji : formatKindText;
    const eventsByBaker = (0, lodash_1.groupBy)(events, "baker");
    const lines = [];
    for (const baker in eventsByBaker) {
        const bakerEvents = eventsByBaker[baker];
        const eventsByKind = (0, lodash_1.groupBy)(bakerEvents, "kind");
        const formattedWithCounts = [];
        for (const kind in eventsByKind) {
            let formattedRange = "";
            const events = eventsByKind[kind];
            const count = events.length;
            let rangeCount = count;
            if (kind === events_1.Events.Deactivated || kind === events_1.Events.DeactivationRisk) {
                const firstEvent = (0, lodash_1.first)(events);
                formattedRange = `cycle ${firstEvent.cycle}`;
            }
            else {
                const [firstLevel, lastLevel] = (0, exports.levelRange)(events);
                formattedRange = (0, exports.formatRange)(firstLevel, lastLevel);
                if (firstLevel && lastLevel) {
                    rangeCount = lastLevel - firstLevel + 1;
                }
            }
            const formattedKind = `${formatKind(kind)} @${formattedRange}${count === rangeCount ? "" : (0, exports.n2superscript)(count)}`;
            formattedWithCounts.push(formattedKind);
        }
        const formattedBaker = addressAliases[baker] ||
            (abbreviateAddress ? (0, exports.abbreviateBakerAddress)(baker) : baker);
        if (linePerBaker) {
            const line = `${formattedBaker} ${formattedWithCounts.join(" ")}`;
            lines.push(line);
        }
        else {
            const bakerLines = formattedWithCounts.map((x, i) => {
                if (i === 0) {
                    return `${formattedBaker} ${x}`;
                }
                return `. ${x}`.padStart(x.length + formattedBaker.length + 1);
            });
            Array.prototype.push.apply(lines, bakerLines);
        }
    }
    return lines;
};
exports.aggregateByBaker = aggregateByBaker;
const summary = (events, useEmoji = false) => {
    const formatKind = useEmoji ? formatKindEmoji : formatKindText;
    const counts = (0, lodash_1.countBy)(events, "kind");
    const [firstLevel, lastLevel] = (0, exports.levelRange)(events);
    const formattedRange = (0, exports.formatRange)(firstLevel, lastLevel);
    const allEventNames = Object.values(eventTypes.Events);
    const parts = [];
    for (const kind of allEventNames) {
        if (counts[kind]) {
            parts.push(`${formatKind(kind)} ${counts[kind]}`);
        }
    }
    if (formattedRange) {
        parts.push(`@${formattedRange}`);
    }
    return parts.join(" ");
};
exports.summary = summary;
const email = (events, useEmoji = false, abbreviateAddress = false, addressAliases = {}) => {
    const lines = format(events, useEmoji, abbreviateAddress, true, addressAliases);
    let subject;
    let text;
    if (lines.length === 1) {
        subject = lines[0];
        text = "";
    }
    else {
        subject = (0, exports.summary)(events, useEmoji);
        text = lines.join("\n");
    }
    return [subject, text];
};
exports.email = email;
