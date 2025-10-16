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
const NodeMonitor = __importStar(require("./nodeMonitor"));
const BakerMonitor = __importStar(require("./bakerMonitor"));
const channel = __importStar(require("./channel"));
const email_1 = require("./senders/email");
const desktop_1 = require("./senders/desktop");
const http_1 = require("./senders/http");
const telegram_1 = require("./senders/telegram");
const slack_1 = require("./senders/slack");
const EventLog = __importStar(require("./eventlog"));
const loglevel_1 = require("loglevel");
const Config = __importStar(require("./config"));
const fs_utils_1 = require("./fs-utils");
const proper_lockfile_1 = require("proper-lockfile");
const path_1 = require("path");
const logging_1 = require("./logging");
const server_1 = require("./api/server");
const run = async (config) => {
    // Makes the script crash on unhandled rejections instead of silently ignoring them.
    process.on("unhandledRejection", (err) => {
        throw err;
    });
    (0, logging_1.setup)(config.logging);
    const storageDir = (0, path_1.normalize)(config.storageDirectory);
    const pid = process.pid;
    const pidFile = (0, path_1.join)(storageDir, "pid");
    let pidFileLock;
    try {
        await (0, fs_utils_1.ensureExists)(pidFile, pid);
        pidFileLock = await (0, proper_lockfile_1.lock)(pidFile);
    }
    catch (err) {
        (0, loglevel_1.error)(err);
        process.exit(1);
    }
    await (0, fs_utils_1.writeJson)(pidFile, pid);
    const eventLog = await EventLog.open(storageDir);
    const notificationsConfig = config.notifications;
    const createChannel = async (name, sender) => {
        return await channel.create(name, sender, storageDir, eventLog, notificationsConfig);
    };
    const channels = [];
    const emailConfig = config.email;
    if (emailConfig?.enabled) {
        channels.push(await createChannel("email", (0, email_1.create)(emailConfig)));
    }
    const desktopConfig = config.desktop;
    if (desktopConfig?.enabled) {
        channels.push(await createChannel("desktop", (0, desktop_1.create)(desktopConfig)));
    }
    const webhookConfig = config.webhook;
    if (webhookConfig?.enabled) {
        channels.push(await createChannel("webhook", (0, http_1.create)(webhookConfig)));
    }
    const telegramConfig = config.telegram;
    if (telegramConfig?.enabled) {
        channels.push(await createChannel("telegram", await (0, telegram_1.create)(telegramConfig, storageDir)));
    }
    const slackConfig = config.slack;
    if (slackConfig?.enabled) {
        channels.push(await createChannel("slack", (0, slack_1.create)(slackConfig)));
    }
    const excludedEvents = config.excludedEvents;
    const onEvent = async (event) => {
        if ("kind" in event && excludedEvents.includes(event.kind)) {
            (0, loglevel_1.debug)(`Event excluded because type ${event.kind} is filtered`, event);
            return;
        }
        await eventLog.add(event);
    };
    const nodeMonitorConfig = config.nodeMonitor;
    const { teztnets } = nodeMonitorConfig;
    const bakerMonitorConfig = config.bakerMonitor;
    const userHome = process.env.HOME;
    const tezosClientBaseDir = [
        "/var/lib/tezos/.tezos-client",
        `${userHome}/.tezos-client`,
        process.env.TEZOS_CLIENT_DIR,
    ];
    const tezosClientBakers = [];
    const tezosClientEndpoints = [];
    if (config.autodetect.enabled) {
        for (const dir of tezosClientBaseDir) {
            if (!dir)
                continue;
            const pkhFile = (0, path_1.join)(dir, "public_key_hashs");
            try {
                (0, loglevel_1.info)(`Reading tezos client pkh list from ${pkhFile}...`);
                const pkhList = (await (0, fs_utils_1.readJson)(pkhFile));
                for (const { name, value } of pkhList) {
                    if (value) {
                        (0, loglevel_1.info)(`Found pkh ${name} ${value}`);
                        if (name == "baker") {
                            tezosClientBakers.push(value);
                            break;
                        }
                    }
                }
            }
            catch (err) {
                (0, loglevel_1.info)(`Could not read ${pkhFile}`);
                (0, loglevel_1.debug)(err);
            }
        }
        for (const dir of tezosClientBaseDir) {
            if (!dir)
                continue;
            const tzClientConfigFile = (0, path_1.join)(dir, "config");
            try {
                (0, loglevel_1.info)(`Reading tezos client config from ${tzClientConfigFile}...`);
                const tzClientConfig = (await (0, fs_utils_1.readJson)(tzClientConfigFile));
                if (tzClientConfig.endpoint) {
                    (0, loglevel_1.info)(`Found tezos client endpoint ${tzClientConfig.endpoint}`);
                    tezosClientEndpoints.push(tzClientConfig.endpoint);
                }
            }
            catch (err) {
                (0, loglevel_1.info)(`Could not read ${tzClientConfigFile}`);
                (0, loglevel_1.debug)(err);
            }
        }
    }
    if (tezosClientEndpoints.length > 0) {
        const rpcNode = Config.toNamedNode(tezosClientEndpoints[0]);
        if (rpcNode) {
            bakerMonitorConfig.rpc = rpcNode;
            (0, loglevel_1.info)(`Using tezos client endpoint ${bakerMonitorConfig.rpc.url} for baker rpc`);
        }
        else {
            console.warn(`Found tezos client endpoint ${tezosClientEndpoints[0]} but it doesn't appear to be a valid URL`);
        }
    }
    const bakers = [...tezosClientBakers, ...bakerMonitorConfig.bakers];
    bakerMonitorConfig.bakers = bakers;
    function notEmpty(value) {
        return value !== null && value !== undefined;
    }
    const nodes = [
        ...tezosClientEndpoints.map(Config.toNamedNode).filter(notEmpty),
        ...nodeMonitorConfig.nodes,
    ];
    //if there are bakers to monitor also monitor rpc node
    if (bakers.length > 0) {
        nodes.push(bakerMonitorConfig.rpc);
    }
    if (bakers.length === 0 && nodes.length === 0 && !teztnets) {
        console.error("You must specify nodes or bakers to watch.");
        process.exit(1);
    }
    let uiConfig = config.ui;
    if ((tezosClientEndpoints.length > 0 || tezosClientBakers.length > 0) &&
        config.ui.show_system_info === undefined) {
        (0, loglevel_1.info)("Found local tezos setup, enabling system info ui");
        uiConfig = { ...config.ui, show_system_info: true };
    }
    const bakerMonitor = bakers.length > 0
        ? await BakerMonitor.create(storageDir, bakerMonitorConfig, config.rpc, uiConfig.enabled, onEvent)
        : null;
    const nodeMonitor = nodes.length > 0 || teztnets
        ? await NodeMonitor.create(onEvent, { ...nodeMonitorConfig, nodes }, config.rpc)
        : null;
    const gc = EventLog.gc(eventLog, channels);
    const apiServer = uiConfig.enabled
        ? (0, server_1.start)(nodeMonitor, bakerMonitor, bakerMonitorConfig.rpc.url, uiConfig, config.rpc)
        : null;
    const stop = (event) => {
        (0, loglevel_1.info)(`Caught signal ${event}, shutting down...`);
        apiServer?.close();
        bakerMonitor?.stop();
        nodeMonitor?.stop();
        for (const ch of channels) {
            ch.stop();
        }
        gc.stop();
        const gracePeriod = 5;
        const timeoutHandle = setTimeout(() => {
            (0, loglevel_1.info)(`Some tasks are still running after ${gracePeriod} s, force exit`);
            process.exit(0);
        }, gracePeriod * 1e3);
        //make sure this timer itself doesn't delay process exit
        timeoutHandle.unref();
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
    process.on("exit", (code) => (0, loglevel_1.info)(`Done (exit code ${code})`));
    const channelTasks = channels.map((ch) => ch.start());
    const gcTask = gc.start();
    const allTasks = [...channelTasks, gcTask];
    if (nodeMonitor) {
        const nodeMonitorTask = nodeMonitor.start();
        allTasks.push(nodeMonitorTask);
    }
    if (bakerMonitor) {
        const bakerMonitorTask = bakerMonitor.start();
        allTasks.push(bakerMonitorTask);
    }
    (0, loglevel_1.info)("Started");
    await Promise.all(allTasks);
    (0, loglevel_1.debug)(`Releasing file lock on ${pidFile}`);
    await pidFileLock();
};
exports.default = run;
