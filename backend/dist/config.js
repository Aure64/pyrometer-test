"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.load = exports.toNamedNode = exports.makeSampleConfig = exports.yargResetOptions = exports.yargRunOptions = void 0;
const nconf_1 = __importDefault(require("nconf"));
const util_1 = require("util");
const toml_1 = __importDefault(require("@iarna/toml"));
const env_paths_1 = __importDefault(require("env-paths"));
const utils_1 = require("@taquito/utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yargs_1 = __importDefault(require("yargs"));
const validatorjs_1 = __importDefault(require("validatorjs"));
const events_1 = require("./events");
const setPath_1 = __importDefault(require("./setPath"));
const url_1 = require("url");
const APP_NAME = "pyrometer";
const TZ_ADDRESS_ALIAS_KEY = "alias";
const BAKER_GROUP = { key: "baker_monitor", label: "Baker Monitor:" };
const BAKERS = {
    key: `${BAKER_GROUP.key}:bakers`,
    default: [],
    description: "Baker address to monitor",
    alias: ["b", "bakers"],
    type: "string",
    group: BAKER_GROUP.label,
    isArray: true,
    validationRule: "baker",
};
const BAKER_CATCHUP_LIMIT = {
    key: `${BAKER_GROUP.key}:max_catchup_blocks`,
    default: 120,
    description: "The maximum number of blocks to catch up on after reconnecting.",
    alias: undefined,
    type: "number",
    group: BAKER_GROUP.label,
    isArray: false,
    validationRule: ["numeric", "min:0"],
};
const BAKER_HEAD_DISTANCE = {
    key: `${BAKER_GROUP.key}:head_distance`,
    default: 2,
    description: "Number of blocks to lag behind head",
    alias: undefined,
    type: "number",
    group: BAKER_GROUP.label,
    isArray: false,
    validationRule: ["numeric", "min:0"],
};
const BAKER_MISSED_THRESHOLD = {
    key: `${BAKER_GROUP.key}:missed_threshold`,
    default: 5,
    description: "Consider baker unhealthy after this many missed bakes or endorsements",
    alias: undefined,
    type: "number",
    group: BAKER_GROUP.label,
    isArray: false,
    validationRule: ["numeric", "min:1"],
};
const RPC = {
    key: `${BAKER_GROUP.key}:rpc`,
    default: "https://mainnet.api.tez.ie/",
    description: "Tezos RPC URL to query for baker and chain info",
    alias: ["r", "rpc"],
    type: "string",
    group: BAKER_GROUP.label,
    isArray: false,
    validationRule: "named_node",
};
const LOG_GROUP = { key: "log", label: "Logging:" };
const LOG_LEVELS = ["trace", "info", "debug", "warn", "error"];
const LOG_LEVEL = {
    key: `${LOG_GROUP.key}:level`,
    default: "info",
    description: `Level of logging. [${LOG_LEVELS}]`,
    alias: "l",
    type: "string",
    group: LOG_GROUP.label,
    isArray: false,
    validationRule: "loglevel",
};
const LOG_TIMESTAMP = {
    key: `${LOG_GROUP.key}:timestamp`,
    default: true,
    sampleValue: false,
    description: `Include timestamp when formatting log messages`,
    alias: undefined,
    type: "boolean",
    group: LOG_GROUP.label,
    isArray: false,
    validationRule: "boolean",
};
const DATA_DIR = {
    key: "data_dir",
    default: process.env.STATE_DIRECTORY || (0, env_paths_1.default)(APP_NAME, { suffix: "" }).data,
    description: "Data directory",
    alias: ["d", "data-dir"],
    type: "string",
    group: undefined,
    isArray: false,
    validationRule: "string",
};
const NODE_MONITOR_GROUP = {
    key: "node_monitor",
    label: "Node Monitor:",
};
const NODES = {
    key: `${NODE_MONITOR_GROUP.key}:nodes`,
    default: [],
    description: "Node RPC URLs to watch for node events.",
    alias: ["n", "nodes"],
    type: "string",
    group: NODE_MONITOR_GROUP.label,
    isArray: true,
    validationRule: "named_node",
};
const WITH_TEZTNETS = {
    key: `${NODE_MONITOR_GROUP.key}:teztnets`,
    default: false,
    description: "Enable monitoring of nodes listed at https://teztnets.xyz/",
    alias: ["T", "teztnets"],
    type: "boolean",
    group: NODE_MONITOR_GROUP.label,
    isArray: false,
    validationRule: "boolean",
};
const TEZTNETS_CONFIG = {
    key: `${NODE_MONITOR_GROUP.key}:teztnets_config`,
    default: "https://teztnets.xyz/teztnets.json",
    description: "URL or local file path to teztnets config file",
    alias: undefined,
    type: "string",
    group: NODE_MONITOR_GROUP.label,
    isArray: false,
    validationRule: [
        "string",
        { required_if: [`${NODE_MONITOR_GROUP.key}.teztnets`, true] },
    ],
};
const LOW_PEER_COUNT = {
    key: `${NODE_MONITOR_GROUP.key}:low_peer_count`,
    default: undefined,
    sampleValue: 5,
    description: "Low peer count thrashold",
    alias: undefined,
    type: "number",
    group: NODE_MONITOR_GROUP.label,
    isArray: false,
    validationRule: ["numeric", "min:1"],
};
const mkExcludeEventsPref = (key, group, defaultValue = []) => {
    return {
        key,
        default: defaultValue,
        description: `Events to omit from notifications\nAvailable options: ${Object.values(events_1.Events).join(", ")}`,
        alias: undefined,
        type: "string",
        group,
        isArray: true,
        validationRule: "string",
    };
};
const mkOnlyBakersPref = (key, group) => {
    return {
        key,
        default: undefined,
        description: `Only these bakers will receive notifications through this channel.`,
        alias: undefined,
        type: "string",
        group: group,
        isArray: true,
        validationRule: "baker",
    };
};
const EXCLUDED_EVENTS = mkExcludeEventsPref("exclude", undefined, [
    events_1.Events.Baked,
    events_1.Events.Endorsed,
]);
const SLACK_GROUP = "Slack Notifications:";
const SLACK_KEY = "slack";
const SLACK_ENABLED = {
    key: `${SLACK_KEY}:enabled`,
    default: false,
    description: "Whether slack notifier is enabled",
    alias: undefined,
    type: "boolean",
    group: SLACK_GROUP,
    isArray: false,
    validationRule: "boolean",
};
const SLACK_URL = {
    key: `${SLACK_KEY}:url`,
    default: undefined,
    sampleValue: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
    description: "Webhook URL for Slack notifications",
    alias: undefined,
    type: "string",
    group: SLACK_GROUP,
    isArray: false,
    validationRule: ["link", { required_if: [`${SLACK_KEY}.enabled`, true] }],
};
const SLACK_EMOJI = {
    key: `${SLACK_KEY}:emoji`,
    default: true,
    description: "Use emoji in notification text",
    alias: undefined,
    type: "boolean",
    group: SLACK_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const SLACK_SHORT_ADDRESS = {
    key: `${SLACK_KEY}:short_address`,
    default: true,
    description: "Abbreviate baker addresses in notification text",
    alias: undefined,
    type: "boolean",
    group: SLACK_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const SLACK_EXCLUDED_EVENTS = mkExcludeEventsPref(`${SLACK_KEY}:exclude`, SLACK_GROUP);
const SLACK_ONLY_BAKERS = mkOnlyBakersPref(`${SLACK_KEY}:bakers`, SLACK_GROUP);
const TELEGRAM_GROUP = "Telegram Notifications:";
const TELEGRAM_KEY = "telegram";
const TELEGRAM_ENABLED = {
    key: `${TELEGRAM_KEY}:enabled`,
    default: false,
    description: "Whether telegram notifier is enabled",
    alias: undefined,
    type: "boolean",
    group: TELEGRAM_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const TELEGRAM_TOKEN = {
    key: `${TELEGRAM_KEY}:token`,
    default: undefined,
    sampleValue: "1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    description: "API token for Telegram notification channel",
    alias: undefined,
    type: "string",
    group: TELEGRAM_GROUP,
    isArray: false,
    validationRule: [
        "string",
        { required_if: [`${TELEGRAM_KEY}.enabled`, true] },
    ],
};
const TELEGRAM_EMOJI = {
    key: `${TELEGRAM_KEY}:emoji`,
    default: true,
    description: "Use emoji in notification text",
    alias: undefined,
    type: "boolean",
    group: TELEGRAM_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const TELEGRAM_SHORT_ADDRESS = {
    key: `${TELEGRAM_KEY}:short_address`,
    default: true,
    description: "Abbreviate baker addresses in notification text",
    alias: undefined,
    type: "boolean",
    group: TELEGRAM_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const TELEGRAM_EXCLUDED_EVENTS = mkExcludeEventsPref(`${TELEGRAM_KEY}:exclude`, TELEGRAM_GROUP);
const TELEGRAM_ONLY_BAKERS = mkOnlyBakersPref(`${TELEGRAM_KEY}:bakers`, TELEGRAM_GROUP);
const EMAIL_GROUP = "Email Notifications:";
const EMAIL_KEY = "email";
const EMAIL_REQUIRED = { required_if: [`${EMAIL_KEY}.enabled`, true] };
const EMAIL_ENABLED = {
    key: `${EMAIL_KEY}:enabled`,
    default: false,
    description: "Whether email notifier is enabled",
    alias: undefined,
    type: "boolean",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const EMAIL_HOST = {
    key: `${EMAIL_KEY}:host`,
    default: undefined,
    description: "Host for email notification channel",
    sampleValue: "localhost",
    alias: undefined,
    type: "string",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: ["string", EMAIL_REQUIRED],
};
const EMAIL_PORT = {
    key: `${EMAIL_KEY}:port`,
    default: undefined,
    sampleValue: 25,
    description: "Port for email notification channel",
    alias: undefined,
    type: "number",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: ["numeric", "min:1", EMAIL_REQUIRED],
};
const PROTOCOL_OPTIONS = ["PLAIN", "SSL", "STARTTLS"];
const EMAIL_PROTOCOL = {
    key: `${EMAIL_KEY}:protocol`,
    default: "PLAIN",
    description: `Protocol for email notification channel [${PROTOCOL_OPTIONS}]`,
    alias: undefined,
    type: "string",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: ["email_protocol"],
};
const EMAIL_USERNAME = {
    key: `${EMAIL_KEY}:username`,
    default: undefined,
    sampleValue: "",
    description: "Username for email notification channel",
    alias: undefined,
    type: "string",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: "string",
};
const EMAIL_PASSWORD = {
    key: `${EMAIL_KEY}:password`,
    default: undefined,
    sampleValue: "",
    description: "Password for email notification channel",
    alias: undefined,
    type: "string",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: "string",
};
const EMAIL_TO = {
    key: `${EMAIL_KEY}:to`,
    default: undefined,
    sampleValue: ["me@example.org"],
    description: "Address for email notifier channel",
    alias: undefined,
    type: "string",
    group: EMAIL_GROUP,
    isArray: true,
    validationRule: ["email", EMAIL_REQUIRED],
};
const EMAIL_FROM = {
    key: `${EMAIL_KEY}:from`,
    default: undefined,
    sampleValue: `${APP_NAME} <me@example.org>`,
    description: "Email's 'Form:' address, by default same as the first 'To:' address",
    alias: undefined,
    type: "string",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: ["string"],
};
const EMAIL_EMOJI = {
    key: `${EMAIL_KEY}:emoji`,
    default: true,
    description: "Use emoji in notification text",
    alias: undefined,
    type: "boolean",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const EMAIL_SHORT_ADDRESS = {
    key: `${EMAIL_KEY}:short_address`,
    default: true,
    description: "Abbreviate baker addresses in notification text",
    alias: undefined,
    type: "boolean",
    group: EMAIL_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const EMAIL_EXCLUDED_EVENTS = mkExcludeEventsPref(`${EMAIL_KEY}:exclude`, EMAIL_GROUP);
const EMAIL_ONLY_BAKERS = mkOnlyBakersPref(`${EMAIL_KEY}:bakers`, EMAIL_GROUP);
const DESKTOP_GROUP = "Desktop Notifications:";
const DESKTOP_KEY = "desktop";
const DESKTOP_ENABLED = {
    key: `${DESKTOP_KEY}:enabled`,
    default: false,
    description: "Whether desktop notifier is enabled",
    alias: undefined,
    type: "boolean",
    group: DESKTOP_GROUP,
    isArray: false,
    validationRule: "boolean",
};
const DESKTOP_SOUND = {
    key: `${DESKTOP_KEY}:sound`,
    default: false,
    description: "Whether desktop notifier should use sound",
    alias: undefined,
    type: "boolean",
    group: DESKTOP_GROUP,
    isArray: false,
    validationRule: "boolean",
};
const DESKTOP_EMOJI = {
    key: `${DESKTOP_KEY}:emoji`,
    default: true,
    description: "Use emoji in notification text",
    alias: undefined,
    type: "boolean",
    group: DESKTOP_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const DESKTOP_SHORT_ADDRESS = {
    key: `${DESKTOP_KEY}:short_address`,
    default: true,
    description: "Abbreviate baker addresses in notification text",
    alias: undefined,
    type: "boolean",
    group: DESKTOP_GROUP,
    isArray: false,
    validationRule: ["boolean"],
};
const DESKTOP_EXCLUDED_EVENTS = mkExcludeEventsPref(`${DESKTOP_KEY}:exclude`, DESKTOP_GROUP);
const DESKTOP_ONLY_BAKERS = mkOnlyBakersPref(`${DESKTOP_KEY}:bakers`, DESKTOP_GROUP);
const WEBHOOK_GROUP = "Webhook Notifications:";
const WEBHOOK_KEY = "webhook";
const WEBHOOK_ENABLED = {
    key: `${WEBHOOK_KEY}:enabled`,
    default: false,
    description: "Whether webhook notifier is enabled",
    alias: undefined,
    type: "boolean",
    group: WEBHOOK_GROUP,
    isArray: false,
    validationRule: "boolean",
};
const WEBHOOK_URL = {
    key: `${WEBHOOK_KEY}:url`,
    default: undefined,
    sampleValue: "http://192.168.1.10/mywebhook",
    description: "URL for posting raw JSON notifications",
    alias: undefined,
    type: "string",
    group: WEBHOOK_GROUP,
    isArray: false,
    validationRule: ["link", { required_if: [`${WEBHOOK_KEY}.enabled`, true] }],
};
const WEBHOOK_USER_AGENT = {
    key: `${WEBHOOK_KEY}:user_agent`,
    default: `${APP_NAME}/${process.env.npm_package_version}`,
    description: "User agent string to set when for posting to webhook",
    alias: undefined,
    type: "string",
    group: WEBHOOK_GROUP,
    isArray: false,
    validationRule: "string",
};
const WEBHOOK_TEST_ENDPOINT_PORT = {
    key: `${WEBHOOK_KEY}:test_endpoint_port`,
    default: 0,
    description: "Start web server on specified port to test webhook notifications",
    alias: undefined,
    type: "string",
    group: WEBHOOK_GROUP,
    isArray: false,
    validationRule: ["numeric", "min:0"],
};
const WEBHOOK_EXCLUDED_EVENTS = mkExcludeEventsPref(`${WEBHOOK_KEY}:exclude`, WEBHOOK_GROUP);
const WEBHOOK_ONLY_BAKERS = mkOnlyBakersPref(`${WEBHOOK_KEY}:bakers`, WEBHOOK_GROUP);
const WEBHOOK_REQUEST_TIMEOUT = {
    key: `${WEBHOOK_KEY}:request_timeout`,
    default: 30,
    description: "Webhook request timeout in seconds",
    alias: undefined,
    type: "number",
    group: WEBHOOK_GROUP,
    isArray: false,
    validationRule: ["numeric", "min:0"],
};
const configDirectory = process.env.CONFIGURATION_DIRECTORY ||
    (0, env_paths_1.default)(APP_NAME, { suffix: "" }).config;
const CONFIG_FILE = {
    key: "config",
    default: path_1.default.join(configDirectory, `${APP_NAME}.toml`),
    description: "Path to configuration file.",
    alias: "c",
    type: "string",
    group: undefined,
    isArray: false,
    cliOnly: true,
    validationRule: "string",
};
const NOTIFICATIONS_GROUP = "Notifications:";
const NOTIFICATIONS_KEY = "notifications";
const NOTIFICATIONS_MAX_BATCH_SIZE = {
    key: `${NOTIFICATIONS_KEY}:max_batch_size`,
    default: 100,
    description: "Maximum number of events to process in one batch",
    alias: undefined,
    type: "number",
    group: NOTIFICATIONS_GROUP,
    isArray: false,
    validationRule: ["numeric", "min:0"],
};
const NOTIFICATIONS_INTERVAL = {
    key: `${NOTIFICATIONS_KEY}:interval`,
    default: 60,
    description: "Post notifications for accumulated events at this interval (in seconds)",
    alias: undefined,
    type: "number",
    group: NOTIFICATIONS_GROUP,
    isArray: false,
    validationRule: ["numeric", "min:1"],
};
const NOTIFICATIONS_TTL = {
    key: `${NOTIFICATIONS_KEY}:ttl`,
    default: 24 * 60 * 60,
    description: "Time to live for queued up events (in seconds)",
    alias: undefined,
    type: "number",
    group: NOTIFICATIONS_GROUP,
    isArray: false,
    validationRule: ["numeric", "min:1"],
};
const UI_GROUP = { key: "ui", label: "User Interface:" };
const UI_ENABLED = {
    key: `${UI_GROUP.key}:enabled`,
    default: true,
    description: "Whether web UI is enabled",
    alias: undefined,
    type: "boolean",
    group: UI_GROUP.label,
    isArray: false,
    validationRule: "boolean",
};
const UI_PORT = {
    key: `${UI_GROUP.key}:port`,
    default: 2020,
    description: "Web server port",
    alias: undefined,
    type: "string",
    group: UI_GROUP.label,
    isArray: false,
    validationRule: ["numeric", "min:1"],
};
const UI_HOST = {
    key: `${UI_GROUP.key}:host`,
    default: "localhost",
    description: "Web server host",
    alias: undefined,
    type: "string",
    group: UI_GROUP.label,
    isArray: false,
    validationRule: "string",
};
const UI_WEBROOT = {
    key: `${UI_GROUP.key}:webroot`,
    default: undefined,
    description: "Directory where UI web application code and resources are located, automatically detected by default.",
    alias: undefined,
    type: "string",
    group: UI_GROUP.label,
    isArray: false,
    validationRule: "string",
};
const UI_EXPLORER_URL = {
    key: `${UI_GROUP.key}:explorer_url`,
    default: "https://tzstats.com",
    description: "URL of blockchain explorer to use for baker and block links",
    alias: undefined,
    type: "string",
    group: UI_GROUP.label,
    isArray: false,
    validationRule: "link",
};
const UI_SHOW_SYSTEM_INFO = {
    key: `${UI_GROUP.key}:show_system_info`,
    default: undefined,
    description: "Show system info section",
    alias: undefined,
    type: "boolean",
    group: UI_GROUP.label,
    isArray: false,
    validationRule: "boolean",
};
const AUTODETECT_GROUP = { key: "autodetect", label: "Auto-detect:" };
const AUTODETECT_ENABLED = {
    key: `${AUTODETECT_GROUP.key}:enabled`,
    default: true,
    description: "Whether auto-detection of baker and node to monitor is on",
    alias: undefined,
    type: "boolean",
    group: AUTODETECT_GROUP.label,
    isArray: false,
    validationRule: "boolean",
};
const RPC_GROUP = { key: "rpc", label: "RPC:" };
const RPC_RETRY_INTERVAL_MS = {
    key: `${RPC_GROUP.key}:retry_interval_ms`,
    default: 1000,
    description: "RPC retry interval",
    alias: undefined,
    type: "number",
    group: RPC_GROUP.label,
    isArray: false,
    validationRule: ["numeric", "min:100"],
};
const RPC_RETRY_ATTEMPTS = {
    key: `${RPC_GROUP.key}:retry_attempts`,
    default: 3,
    description: "Maximum number of RPC retries",
    alias: undefined,
    type: "number",
    group: RPC_GROUP.label,
    isArray: false,
    validationRule: ["numeric", "min:1"],
};
// list of all prefs that should be iterated to build yargs options and nconf defaults
const userPrefs = [
    BAKERS,
    BAKER_CATCHUP_LIMIT,
    BAKER_HEAD_DISTANCE,
    BAKER_MISSED_THRESHOLD,
    DATA_DIR,
    LOG_LEVEL,
    LOG_TIMESTAMP,
    NODES,
    RPC,
    WITH_TEZTNETS,
    TEZTNETS_CONFIG,
    LOW_PEER_COUNT,
    EXCLUDED_EVENTS,
    SLACK_ENABLED,
    SLACK_URL,
    SLACK_EMOJI,
    SLACK_SHORT_ADDRESS,
    SLACK_EXCLUDED_EVENTS,
    SLACK_ONLY_BAKERS,
    TELEGRAM_ENABLED,
    TELEGRAM_TOKEN,
    TELEGRAM_EMOJI,
    TELEGRAM_SHORT_ADDRESS,
    TELEGRAM_EXCLUDED_EVENTS,
    TELEGRAM_ONLY_BAKERS,
    EMAIL_ENABLED,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_PROTOCOL,
    EMAIL_TO,
    EMAIL_FROM,
    EMAIL_USERNAME,
    EMAIL_PASSWORD,
    EMAIL_EMOJI,
    EMAIL_SHORT_ADDRESS,
    EMAIL_EXCLUDED_EVENTS,
    EMAIL_ONLY_BAKERS,
    DESKTOP_ENABLED,
    DESKTOP_SOUND,
    DESKTOP_EMOJI,
    DESKTOP_SHORT_ADDRESS,
    DESKTOP_EXCLUDED_EVENTS,
    DESKTOP_ONLY_BAKERS,
    WEBHOOK_ENABLED,
    WEBHOOK_URL,
    WEBHOOK_USER_AGENT,
    WEBHOOK_TEST_ENDPOINT_PORT,
    WEBHOOK_EXCLUDED_EVENTS,
    WEBHOOK_ONLY_BAKERS,
    WEBHOOK_REQUEST_TIMEOUT,
    CONFIG_FILE,
    NOTIFICATIONS_INTERVAL,
    NOTIFICATIONS_MAX_BATCH_SIZE,
    NOTIFICATIONS_TTL,
    UI_ENABLED,
    UI_HOST,
    UI_PORT,
    UI_WEBROOT,
    UI_EXPLORER_URL,
    UI_SHOW_SYSTEM_INFO,
    AUTODETECT_ENABLED,
    RPC_RETRY_ATTEMPTS,
    RPC_RETRY_INTERVAL_MS,
];
/**
 * Iterates through the UserPrefs to create the Yarg settings used for parsing and providing help
 * for argv options.
 */
const makeYargOptions = (userPrefs) => {
    const options = userPrefs.reduce((accumulator, pref) => {
        const defaultDescription = pref.default !== undefined ? `${pref.default}` : undefined;
        accumulator[pref.key] = {
            type: pref.type,
            alias: pref.alias,
            description: pref.description,
            defaultDescription,
            group: pref.group,
            array: pref.isArray,
        };
        return accumulator;
    }, {});
    return options;
};
exports.yargRunOptions = makeYargOptions(userPrefs);
exports.yargResetOptions = makeYargOptions([DATA_DIR, CONFIG_FILE]);
/**
 * Iterates through the UserPrefs to create an object of default config values for Nconf.
 */
const makeConfigDefaults = () => {
    const defaults = userPrefs.reduce((accumulator, pref) => {
        if (pref.default !== undefined) {
            return (0, setPath_1.default)(pref.key, accumulator, pref.default);
        }
        return accumulator;
    }, {});
    return defaults;
};
const makeSampleConfig = () => {
    const sampleConfig = userPrefs.reduce((accumulator, userPref) => {
        // ignore user prefs that are only supported by the command line
        if (!userPref.cliOnly) {
            const value = userPref.sampleValue !== undefined
                ? userPref.sampleValue
                : userPref.default;
            return (0, setPath_1.default)(userPref.key, accumulator, value);
        }
        else {
            return accumulator;
        }
    }, {});
    return sampleConfig;
};
exports.makeSampleConfig = makeSampleConfig;
/**
 * Iterates through the UserPrefs to create the validations object used by validatorjs.  Also creates a
 * few custom validators for specific fields.
 */
const makeConfigValidations = () => {
    validatorjs_1.default.register("baker", (value) => {
        if (typeof value !== "string")
            return false;
        //wildcard "address"
        if (value === "*")
            return true;
        return (0, utils_1.validateAddress)(value) === utils_1.ValidationResult.VALID;
    }, "The :attribute is not a valid baker address.");
    validatorjs_1.default.register("loglevel", (value) => {
        return LOG_LEVELS.includes(`${value}`);
    }, "The :attribute is not a valid log level.");
    validatorjs_1.default.register("email_protocol", (value) => {
        return PROTOCOL_OPTIONS.includes(`${value}`);
    }, "The :attribute is not a valid email protocol.");
    // Validator's URL regex is strict and doesn't accept localhost or IP addresses
    const linkRegex = /^https?:\/\/[^/\s]+(\/.*)?$/;
    validatorjs_1.default.register("link", (value) => {
        return linkRegex.test(`${value}`);
    }, "The :attribute is not a valid link.");
    validatorjs_1.default.register("named_node", 
    //Validator.RegisterCallback type definition is incorrect (doesn't allow object)
    //explicit any tricks TS
    (value) => {
        return !!(0, exports.toNamedNode)(value);
    }, "The :attribute should be either a valid URL or {url, name} object");
    const rules = userPrefs.reduce((accumulator, userPref) => {
        const validationRule = userPref.validationRule;
        if (validationRule && userPref.isArray) {
            const settingsWithArrayRule = (0, setPath_1.default)(userPref.key, accumulator, "array");
            // array validations belong on key.*
            const childKey = `${userPref.key}.*`;
            return (0, setPath_1.default)(childKey, settingsWithArrayRule, validationRule);
        }
        else if (validationRule) {
            return (0, setPath_1.default)(userPref.key, accumulator, validationRule);
        }
        else {
            return accumulator;
        }
    }, {});
    return rules;
};
const formatValidationErrors = (errors) => {
    const formatted = Object.entries(errors)
        .map(([field, messages]) => `${field}:\n${messages.map((m) => "  * " + m).join("\n")}`)
        .join("\n");
    return formatted;
};
const createAliasMap = (configKey) => {
    const defaultAliasMap = nconf_1.default.get(TZ_ADDRESS_ALIAS_KEY) || {};
    const senderAliasMapPath = `${configKey}:${TZ_ADDRESS_ALIAS_KEY}`;
    const senderAliasMap = nconf_1.default.get(senderAliasMapPath) || {};
    nconf_1.default.set(senderAliasMapPath, { ...defaultAliasMap, ...senderAliasMap });
};
const findInvalidAddresses = (aliases) => {
    const invalidAliasedAddresses = Object.keys(aliases).filter((x) => (0, utils_1.validateAddress)(x) !== utils_1.ValidationResult.VALID);
    return invalidAliasedAddresses;
};
const toNamedNode = (configNode) => {
    const normalize = (u) => {
        try {
            const parsed = new url_1.URL(u);
            // canonicaliser localhost -> 127.0.0.1 pour éviter les doublons
            if (parsed.hostname === "localhost")
                parsed.hostname = "127.0.0.1";
            // normaliser en origin (sans trailing slash ni chemin)
            return parsed.origin;
        }
        catch {
            return u;
        }
    };
    if (typeof configNode === "string") {
        const url = normalize(configNode);
        return { url, name: new url_1.URL(url).hostname };
    }
    else if ("url" in configNode) {
        const url = normalize(configNode.url);
        if ("name" in configNode) {
            return { ...configNode, url };
        }
        else {
            return { url, name: new url_1.URL(url).hostname };
        }
    }
};
exports.toNamedNode = toNamedNode;
/**
 * Load config settings from argv and the file system.  File system will use the path from envPaths
 * unless overriden by argv.
 */
const load = async (yargOptions = exports.yargRunOptions, validate = true) => {
    nconf_1.default.argv(yargs_1.default.strict().options(yargOptions));
    const cliOptions = nconf_1.default.get();
    const nonConfigKeys = ["_", "$0"];
    const cliAliases = userPrefs
        .map(({ alias }) => alias)
        .flatMap((x) => x)
        .filter((x) => !!x);
    [...nonConfigKeys, ...cliAliases].forEach((cruft) => {
        delete cliOptions[cruft];
    });
    nconf_1.default.remove("argv");
    nconf_1.default.overrides(cliOptions);
    // user config file from argv overrides default location
    const cliConfigPath = nconf_1.default.get(CONFIG_FILE.key);
    const configPath = cliConfigPath || CONFIG_FILE.default;
    if (cliConfigPath && !fs_1.default.existsSync(cliConfigPath)) {
        console.error(`Specified config file doesn't exist (${configPath})`);
        process.exit(1);
    }
    if (configPath.endsWith(".json")) {
        nconf_1.default.file(configPath);
    }
    else {
        nconf_1.default.file({ file: configPath, format: toml_1.default });
    }
    const configDefaults = makeConfigDefaults();
    nconf_1.default.defaults(configDefaults);
    const loadAsync = (0, util_1.promisify)(nconf_1.default.load.bind(nconf_1.default));
    await loadAsync();
    const loadedConfig = nconf_1.default.get();
    if (validate) {
        const validation = new validatorjs_1.default(loadedConfig, makeConfigValidations());
        const aliasErrors = {};
        for (const configKey of [
            `${TZ_ADDRESS_ALIAS_KEY}`,
            `${TELEGRAM_KEY}:${TZ_ADDRESS_ALIAS_KEY}`,
            `${SLACK_KEY}:${TZ_ADDRESS_ALIAS_KEY}`,
            `${EMAIL_KEY}:${TZ_ADDRESS_ALIAS_KEY}`,
            `${DESKTOP_KEY}:${TZ_ADDRESS_ALIAS_KEY}`,
            `${UI_GROUP.key}:${TZ_ADDRESS_ALIAS_KEY}`,
        ]) {
            const conf = nconf_1.default.get(configKey);
            if (conf) {
                const invalidAliasedAddresses = findInvalidAddresses(conf);
                invalidAliasedAddresses.forEach((x) => (aliasErrors[`${configKey}:${x}`] = ["invalid tz address"]));
            }
        }
        if (validation.fails() || Object.keys(aliasErrors).length > 0) {
            console.error("Invalid config");
            const errors = validation.errors.all();
            console.log(formatValidationErrors({ ...errors, ...aliasErrors }));
            process.exit(1);
        }
    }
    const asObject = () => {
        const obj = nconf_1.default.get();
        delete obj["type"];
        return obj;
    };
    createAliasMap(TELEGRAM_KEY);
    createAliasMap(DESKTOP_KEY);
    createAliasMap(SLACK_KEY);
    createAliasMap(EMAIL_KEY);
    createAliasMap(UI_GROUP.key);
    const createNodeMonitorConfig = () => {
        const rawConfig = nconf_1.default.get(NODE_MONITOR_GROUP.key);
        const configNodes = rawConfig.nodes || [];
        const nodes = [];
        for (const configNode of configNodes) {
            const node = (0, exports.toNamedNode)(configNode);
            if (!node) {
                console.error(`Invalid config: ${NODE_MONITOR_GROUP.key}:nodes is neither string nor {url, name}`, configNode);
                process.exit(1);
            }
            nodes.push(node);
        }
        return { ...rawConfig, nodes };
    };
    const nodeMonitorConfig = createNodeMonitorConfig();
    const createBakerMonitorConfig = () => {
        const rawConfig = nconf_1.default.get(BAKER_GROUP.key);
        const rpc = (0, exports.toNamedNode)(rawConfig.rpc);
        return { ...rawConfig, rpc };
    };
    const bakerMonitoConfig = createBakerMonitorConfig();
    const config = {
        get bakerMonitor() {
            return bakerMonitoConfig;
        },
        get nodeMonitor() {
            return nodeMonitorConfig;
        },
        get logging() {
            return nconf_1.default.get(LOG_GROUP.key);
        },
        get excludedEvents() {
            return nconf_1.default.get(EXCLUDED_EVENTS.key) || [];
        },
        get telegram() {
            return nconf_1.default.get(TELEGRAM_KEY);
        },
        get email() {
            return nconf_1.default.get(EMAIL_KEY);
        },
        get desktop() {
            return nconf_1.default.get(DESKTOP_KEY);
        },
        get webhook() {
            return nconf_1.default.get(WEBHOOK_KEY);
        },
        get slack() {
            return nconf_1.default.get(SLACK_KEY);
        },
        get notifications() {
            return nconf_1.default.get(NOTIFICATIONS_KEY);
        },
        get storageDirectory() {
            return nconf_1.default.get(DATA_DIR.key);
        },
        get ui() {
            return nconf_1.default.get(UI_GROUP.key);
        },
        get autodetect() {
            return nconf_1.default.get(AUTODETECT_GROUP.key);
        },
        get rpc() {
            return nconf_1.default.get(RPC_GROUP.key);
        },
        asObject,
    };
    return config;
};
exports.load = load;
