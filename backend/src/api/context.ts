import { NodeInfoCollection } from "../nodeMonitor";
import { BakerInfoCollection } from "../bakerMonitor";
import client, { RpcClient, RpcClientConfig } from "../rpc/client";
import type { TzAddressAliasMap } from "../config";

export interface Context {
  nodeInfoCollection: NodeInfoCollection;
  bakerInfoCollection: BakerInfoCollection;
  rpc: RpcClient;
  explorerUrl: string | undefined;
  showSystemInfo: boolean | undefined;
  aliasMap: TzAddressAliasMap;
}

export const createContext = (
  nodeInfoCollection: NodeInfoCollection,
  bakerInfoCollection: BakerInfoCollection,
  rpcUrl: string,
  rpcConfig: RpcClientConfig,
  explorerUrl: string | undefined,
  showSystemInfo: boolean | undefined,
  aliasMap: TzAddressAliasMap,
) => {
  return {
    nodeInfoCollection,
    bakerInfoCollection,
    rpc: client(rpcUrl, rpcConfig),
    explorerUrl,
    showSystemInfo,
    aliasMap,
  };
};
