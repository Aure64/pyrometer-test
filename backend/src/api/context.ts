import { NodeInfoCollection } from "../nodeMonitor";
import { BakerInfoCollection } from "../bakerMonitor";
import client, { RpcClient, RpcClientConfig } from "../rpc/client";
import { createTzktClient, TzktClient } from "../tzkt/client";
import type { TzAddressAliasMap } from "../config";
import type { ConfigManager } from "../configManager";

export interface Context {
  nodeInfoCollection: NodeInfoCollection;
  bakerInfoCollection: BakerInfoCollection;
  rpc: RpcClient;
  explorerUrl: string | undefined;
  showSystemInfo: boolean | undefined;
  aliasMap: TzAddressAliasMap;
  tzkt: TzktClient;
  configManager: ConfigManager | null;
  adminToken: string | undefined;
}

export const createContext = (
  nodeInfoCollection: NodeInfoCollection,
  bakerInfoCollection: BakerInfoCollection,
  rpcUrl: string,
  rpcConfig: RpcClientConfig,
  explorerUrl: string | undefined,
  showSystemInfo: boolean | undefined,
  aliasMap: TzAddressAliasMap,
  tzktConfig: { enabled: boolean; base_url: string },
  configManager: ConfigManager | null = null,
  adminToken: string | undefined = undefined,
) => {
  return {
    nodeInfoCollection,
    bakerInfoCollection,
    rpc: client(rpcUrl, rpcConfig),
    explorerUrl,
    showSystemInfo,
    aliasMap,
    tzkt: createTzktClient(tzktConfig),
    configManager,
    adminToken,
  };
};
