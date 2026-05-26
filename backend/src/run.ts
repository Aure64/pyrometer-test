import { Event, Sender } from "./events";
import * as NodeMonitor from "./nodeMonitor";
import * as BakerMonitor from "./bakerMonitor";
import * as channel from "./channel";
import { create as EmailSender } from "./senders/email";
import { create as DesktopSender } from "./senders/desktop";
import { create as HttpSender } from "./senders/http";
import { create as TelegramSender } from "./senders/telegram";
import { create as SlackSender } from "./senders/slack";
import { create as DiscordSender } from "./senders/discord";
import * as EventLog from "./eventlog";
import { debug, info, error } from "loglevel";
import * as Config from "./config";
import { writeJson, ensureExists, readJson } from "./fs-utils";
import { lock } from "proper-lockfile";
import { join as joinPath, normalize as normalizePath } from "path";

import { setup as setupLogging } from "./logging";

import { start as startAPIServer } from "./api/server";
import { ConfigManager } from "./configManager";
import RpcClient from "./rpc/client";
import { create as createBakerGroups } from "./bakerGroups";
import * as WhalesRefresh from "./whalesRefresh";
import { resolveSenderBakers } from "./senderBakersResolver";

type TzClientPkhListItem = { name: string; value: string };

type TzClientConfig = { endpoint: string };

const run = async (config: Config.Config) => {
  // Makes the script crash on unhandled rejections instead of silently ignoring them.
  process.on("unhandledRejection", (err) => {
    throw err;
  });

  setupLogging(config.logging);

  const storageDir = normalizePath(config.storageDirectory);

  const bakerGroups = createBakerGroups(
    config.bakerGroups ?? [],
    config.bakerMonitor.missed_threshold,
    config.bakerMonitor.bakers,
  );

  const pid = process.pid;
  const pidFile = joinPath(storageDir, "pid");
  let pidFileLock;

  try {
    await ensureExists(pidFile, pid);
    pidFileLock = await lock(pidFile);
  } catch (err) {
    error(err);
    process.exit(1);
  }

  await writeJson(pidFile, pid);

  const eventLog = await EventLog.open<Event>(storageDir);
  const notificationsConfig = config.notifications;

  const createChannel = async (
    name: string,
    sender: Sender,
  ): Promise<channel.Channel> => {
    return await channel.create(
      name,
      sender,
      storageDir,
      eventLog,
      notificationsConfig,
    );
  };

  const channels: channel.Channel[] = [];

  const emailConfig = config.email;
  if (emailConfig?.enabled) {
    const resolved = {
      ...emailConfig,
      bakers: resolveSenderBakers(
        Array.isArray(emailConfig.bakers) ? emailConfig.bakers : undefined,
        bakerGroups,
      ),
    };
    channels.push(await createChannel("email", EmailSender(resolved)));
  }

  const desktopConfig = config.desktop;
  if (desktopConfig?.enabled) {
    const resolved = {
      ...desktopConfig,
      bakers: resolveSenderBakers(
        Array.isArray(desktopConfig.bakers) ? desktopConfig.bakers : undefined,
        bakerGroups,
      ),
    };
    channels.push(await createChannel("desktop", DesktopSender(resolved)));
  }

  const webhookConfig = config.webhook;
  if (webhookConfig?.enabled) {
    channels.push(await createChannel("webhook", HttpSender(webhookConfig)));
  }

  const telegramConfig = config.telegram;
  if (telegramConfig?.enabled) {
    const resolved = {
      ...telegramConfig,
      bakers: resolveSenderBakers(
        Array.isArray(telegramConfig.bakers)
          ? telegramConfig.bakers
          : undefined,
        bakerGroups,
      ),
    };
    channels.push(
      await createChannel(
        "telegram",
        await TelegramSender(resolved, storageDir),
      ),
    );
  }

  const slackConfig = config.slack;
  if (slackConfig?.enabled) {
    const resolved = {
      ...slackConfig,
      bakers: resolveSenderBakers(
        Array.isArray(slackConfig.bakers) ? slackConfig.bakers : undefined,
        bakerGroups,
      ),
    };
    channels.push(await createChannel("slack", SlackSender(resolved)));
  }

  const discordConfig = config.discord;
  if (discordConfig?.enabled) {
    const resolved = {
      ...discordConfig,
      bakers: resolveSenderBakers(
        Array.isArray(discordConfig.bakers) ? discordConfig.bakers : undefined,
        bakerGroups,
      ),
    };
    channels.push(await createChannel("discord", DiscordSender(resolved)));
  }

  const excludedEvents = config.excludedEvents;

  const onEvent = async (event: Event) => {
    if ("kind" in event && excludedEvents.includes(event.kind)) {
      debug(`Event excluded because type ${event.kind} is filtered`, event);
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
      if (!dir) continue;
      const pkhFile = joinPath(dir, "public_key_hashs");
      try {
        info(`Reading tezos client pkh list from ${pkhFile}...`);
        const pkhList = (await readJson(pkhFile)) as TzClientPkhListItem[];
        for (const { name, value } of pkhList) {
          if (value) {
            info(`Found pkh ${name} ${value}`);
            if (name == "baker") {
              tezosClientBakers.push(value);
              break;
            }
          }
        }
      } catch (err) {
        debug(`Could not read ${pkhFile}`);
        debug(err);
      }
    }

    for (const dir of tezosClientBaseDir) {
      if (!dir) continue;
      const tzClientConfigFile = joinPath(dir, "config");
      try {
        info(`Reading tezos client config from ${tzClientConfigFile}...`);
        const tzClientConfig = (await readJson(
          tzClientConfigFile,
        )) as TzClientConfig;
        if (tzClientConfig.endpoint) {
          info(`Found tezos client endpoint ${tzClientConfig.endpoint}`);
          tezosClientEndpoints.push(tzClientConfig.endpoint);
        }
      } catch (err) {
        debug(`Could not read ${tzClientConfigFile}`);
        debug(err);
      }
    }
  }

  if (tezosClientEndpoints.length > 0) {
    const rpcNode = Config.toNamedNode(tezosClientEndpoints[0]);
    if (rpcNode) {
      bakerMonitorConfig.rpc = rpcNode;
      info(
        `Using tezos client endpoint ${bakerMonitorConfig.rpc.url} for baker rpc`,
      );
    } else {
      console.warn(
        `Found tezos client endpoint ${tezosClientEndpoints[0]} but it doesn't appear to be a valid URL`,
      );
    }
  }

  const bakers = [...tezosClientBakers, ...bakerMonitorConfig.bakers];
  bakerMonitorConfig.bakers = bakers;

  if (bakers.length === 0 && bakerMonitorConfig.rpc) {
    info(
      "No bakers configured. Add baker addresses in your config file or use the UI Settings page.",
    );
  }

  function notEmpty<TValue>(value: TValue | undefined | null): value is TValue {
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
  if (
    (tezosClientEndpoints.length > 0 || tezosClientBakers.length > 0) &&
    config.ui.show_system_info === undefined
  ) {
    info("Found local tezos setup, enabling system info ui");
    uiConfig = { ...config.ui, show_system_info: true };
  }

  const overridesPath = joinPath(normalizePath(storageDir), "overrides.json");
  const configManager = uiConfig.enabled
    ? new ConfigManager(overridesPath, {
        bakers: bakers,
        aliases: uiConfig.alias || {},
        settings: {
          rpc: bakerMonitorConfig.rpc.url,
          max_catchup_blocks: bakerMonitorConfig.max_catchup_blocks,
          head_distance: bakerMonitorConfig.head_distance,
          missed_threshold: bakerMonitorConfig.missed_threshold,
        },
      })
    : null;
  const cacheFile = joinPath(storageDir, "whales-cache.json");

  // Hydrate stake-based groups from disk cache so bakerMonitor sees the
  // previous snapshot from the first block tick, not just after the first
  // whalesService refreshOnce completes (which happens async and may lag
  // behind the first monitored block by seconds or more).
  {
    const cache = await WhalesRefresh.loadCache(cacheFile);
    for (const [name, addrs] of Object.entries(cache)) {
      if (bakerGroups.getGroup(name)) bakerGroups.setGroupBakers(name, addrs);
    }
  }

  const bakerMonitor =
    bakers.length > 0
      ? await BakerMonitor.create(
          storageDir,
          bakerMonitorConfig,
          config.rpc,
          uiConfig.enabled,
          onEvent,
          bakerGroups,
        )
      : null;

  const sharedRpc = RpcClient(bakerMonitorConfig.rpc.url, config.rpc);
  const WHALES_REFRESH_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000; // 3 Tezos cycles ≈ 72 h
  const hasStakeGroup = bakerGroups
    .listGroups()
    .some((g) => g.kind === "stake");
  const whalesService = hasStakeGroup
    ? WhalesRefresh.create(
        bakerGroups,
        sharedRpc,
        cacheFile,
        WHALES_REFRESH_INTERVAL_MS,
      )
    : null;

  const nodeMonitor =
    nodes.length > 0 || teztnets
      ? await NodeMonitor.create(
          onEvent,
          { ...nodeMonitorConfig, nodes },
          config.rpc,
        )
      : null;

  const gc = EventLog.gc(eventLog, channels);

  const apiServer = uiConfig.enabled
    ? startAPIServer(
        nodeMonitor,
        bakerMonitor,
        bakerMonitorConfig.rpc.url,
        uiConfig,
        config.rpc,
        config.tzkt,
        configManager,
      )
    : null;

  const stop = (event: NodeJS.Signals) => {
    info(`Caught signal ${event}, shutting down...`);
    apiServer?.close();
    bakerMonitor?.stop();
    whalesService?.stop();
    nodeMonitor?.stop();
    for (const ch of channels) {
      ch.stop();
    }
    gc.stop();
    const gracePeriod = 5;
    const timeoutHandle = setTimeout(() => {
      info(`Some tasks are still running after ${gracePeriod} s, force exit`);
      process.exit(0);
    }, gracePeriod * 1e3);
    //make sure this timer itself doesn't delay process exit
    timeoutHandle.unref();
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("exit", (code) => info(`Done (exit code ${code})`));

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

  if (whalesService) {
    allTasks.push(whalesService.start());
  }

  info("Started");
  if (uiConfig.enabled) {
    info(`Web UI available at http://${uiConfig.host}:${uiConfig.port}`);
  }
  await Promise.all(allTasks);
  debug(`Releasing file lock on ${pidFile}`);
  await pidFileLock();
};

export default run;
