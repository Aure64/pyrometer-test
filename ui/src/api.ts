import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type AuthResult = {
  __typename?: 'AuthResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type Baker = {
  __typename?: 'Baker';
  address: Scalars['String']['output'];
  atRisk?: Maybe<Scalars['Boolean']['output']>;
  atRiskThreshold: Scalars['Int']['output'];
  balance?: Maybe<Scalars['String']['output']>;
  blocksPerCycle: Scalars['Int']['output'];
  consensusKey?: Maybe<ConsensusKey>;
  deactivated?: Maybe<Scalars['Boolean']['output']>;
  explorerUrl?: Maybe<Scalars['String']['output']>;
  frozenBalance?: Maybe<Scalars['String']['output']>;
  gracePeriod?: Maybe<Scalars['Int']['output']>;
  headDistance: Scalars['Int']['output'];
  lastProcessed?: Maybe<LastProcessed>;
  octezVersion?: Maybe<Scalars['String']['output']>;
  participation?: Maybe<Participation>;
  recentEvents: Array<LevelEvents>;
  stakingBalance?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['String']['output'];
};

export type BakerEvent = {
  __typename?: 'BakerEvent';
  kind: Scalars['String']['output'];
  priority?: Maybe<Scalars['Int']['output']>;
  slotCount?: Maybe<Scalars['Int']['output']>;
};

export type BakerMonitorSettings = {
  __typename?: 'BakerMonitorSettings';
  headDistance: Scalars['Int']['output'];
  maxCatchupBlocks: Scalars['Int']['output'];
  missedThreshold: Scalars['Int']['output'];
  rpc: Scalars['String']['output'];
};

export type BakerMonitorSettingsInput = {
  head_distance?: InputMaybe<Scalars['Int']['input']>;
  max_catchup_blocks?: InputMaybe<Scalars['Int']['input']>;
  missed_threshold?: InputMaybe<Scalars['Int']['input']>;
  rpc?: InputMaybe<Scalars['String']['input']>;
};

export type Bakers = {
  __typename?: 'Bakers';
  items: Array<Baker>;
  totalCount: Scalars['Int']['output'];
};

export type BlockInfo = {
  __typename?: 'BlockInfo';
  hash: Scalars['String']['output'];
  level: Scalars['Int']['output'];
  payloadRound?: Maybe<Scalars['Int']['output']>;
  payload_round?: Maybe<Scalars['Int']['output']>;
  priority?: Maybe<Scalars['Int']['output']>;
  protocol: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
};

export type ConsensusKey = {
  __typename?: 'ConsensusKey';
  active: Scalars['String']['output'];
  explorerUrl?: Maybe<Scalars['String']['output']>;
  pendings?: Maybe<Array<PendingConsensusKey>>;
};

export type CpuData = {
  __typename?: 'CpuData';
  brand: Scalars['String']['output'];
  cores: Scalars['Int']['output'];
  family: Scalars['String']['output'];
  manufacturer: Scalars['String']['output'];
  model: Scalars['String']['output'];
};

export type CpuTemperatureData = {
  __typename?: 'CpuTemperatureData';
  chipset?: Maybe<Scalars['Float']['output']>;
  cores: Array<Maybe<Scalars['Float']['output']>>;
  main?: Maybe<Scalars['Float']['output']>;
  max?: Maybe<Scalars['Float']['output']>;
  socket?: Maybe<Array<Maybe<Scalars['Float']['output']>>>;
};

export type CpuUsage = {
  __typename?: 'CpuUsage';
  system?: Maybe<Scalars['Float']['output']>;
  user?: Maybe<Scalars['Float']['output']>;
};

export type CurrentLoadData = {
  __typename?: 'CurrentLoadData';
  avgLoad: Scalars['Float']['output'];
};

export type FsSizeData = {
  __typename?: 'FsSizeData';
  available: Scalars['Float']['output'];
  fs: Scalars['String']['output'];
  mount: Scalars['String']['output'];
  size: Scalars['Float']['output'];
  type: Scalars['String']['output'];
  use: Scalars['Float']['output'];
  used: Scalars['Float']['output'];
};

export type LastProcessed = {
  __typename?: 'LastProcessed';
  cycle: Scalars['Int']['output'];
  cyclePosition: Scalars['Int']['output'];
  level: Scalars['Int']['output'];
};

export type LevelEvents = {
  __typename?: 'LevelEvents';
  cycle: Scalars['Int']['output'];
  events: Array<BakerEvent>;
  explorerUrl?: Maybe<Scalars['String']['output']>;
  level: Scalars['Int']['output'];
  timestamp: Scalars['String']['output'];
};

export type MemData = {
  __typename?: 'MemData';
  active: Scalars['Float']['output'];
  swaptotal: Scalars['Float']['output'];
  swapused: Scalars['Float']['output'];
  total: Scalars['Float']['output'];
  used: Scalars['Float']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addBaker: MutationResult;
  authenticate: AuthResult;
  removeAlias: MutationResult;
  removeBaker: MutationResult;
  setAlias: MutationResult;
  updateBakerMonitorSettings: MutationResult;
};


export type MutationAddBakerArgs = {
  address: Scalars['String']['input'];
};


export type MutationAuthenticateArgs = {
  token: Scalars['String']['input'];
};


export type MutationRemoveAliasArgs = {
  address: Scalars['String']['input'];
};


export type MutationRemoveBakerArgs = {
  address: Scalars['String']['input'];
};


export type MutationSetAliasArgs = {
  address: Scalars['String']['input'];
  alias: Scalars['String']['input'];
};


export type MutationUpdateBakerMonitorSettingsArgs = {
  input: BakerMonitorSettingsInput;
};

export type MutationResult = {
  __typename?: 'MutationResult';
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type NetworkInfo = {
  __typename?: 'NetworkInfo';
  blocksPerCycle: Scalars['Int']['output'];
  chainName: Scalars['String']['output'];
  cycle: Scalars['Int']['output'];
  cyclePosition: Scalars['Int']['output'];
  level: Scalars['Int']['output'];
  protocol: Scalars['String']['output'];
};

export type Nodes = {
  __typename?: 'Nodes';
  items: Array<TezosNode>;
  totalCount: Scalars['Int']['output'];
};

export type OsData = {
  __typename?: 'OsData';
  arch?: Maybe<Scalars['String']['output']>;
  build?: Maybe<Scalars['String']['output']>;
  codename?: Maybe<Scalars['String']['output']>;
  codepage?: Maybe<Scalars['String']['output']>;
  distro?: Maybe<Scalars['String']['output']>;
  fqdn?: Maybe<Scalars['String']['output']>;
  hostname?: Maybe<Scalars['String']['output']>;
  hypervizor?: Maybe<Scalars['Boolean']['output']>;
  kernel?: Maybe<Scalars['String']['output']>;
  platform?: Maybe<Scalars['String']['output']>;
  release?: Maybe<Scalars['String']['output']>;
  servicepack?: Maybe<Scalars['String']['output']>;
};

export type Participation = {
  __typename?: 'Participation';
  expected_cycle_activity: Scalars['Int']['output'];
  expected_endorsing_rewards: Scalars['String']['output'];
  minimal_cycle_activity: Scalars['Int']['output'];
  missed_levels: Scalars['Int']['output'];
  missed_slots: Scalars['Int']['output'];
  remaining_allowed_missed_slots: Scalars['Int']['output'];
};

export type PendingConsensusKey = {
  __typename?: 'PendingConsensusKey';
  cycle: Scalars['Int']['output'];
  pkh: Scalars['String']['output'];
};

export type ProcessInfo = {
  __typename?: 'ProcessInfo';
  command: Scalars['String']['output'];
  cpu: Scalars['Float']['output'];
  mem: Scalars['Float']['output'];
  memRss: Scalars['Float']['output'];
  memVsz: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  params?: Maybe<Scalars['String']['output']>;
  path?: Maybe<Scalars['String']['output']>;
  pid: Scalars['Int']['output'];
  started: Scalars['String']['output'];
  user: Scalars['String']['output'];
};

export type PyrometerInfo = {
  __typename?: 'PyrometerInfo';
  processes: Array<ProcessInfo>;
  version: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  aliases: Array<TzAddressAlias>;
  bakerMonitorSettings: BakerMonitorSettings;
  bakers: Bakers;
  configuredBakers: Array<Scalars['String']['output']>;
  isAdminConfigured: Scalars['Boolean']['output'];
  networkInfo?: Maybe<NetworkInfo>;
  nodes: Nodes;
  pyrometer: PyrometerInfo;
  settings: Settings;
  sysInfo: SysInfo;
};


export type QueryBakersArgs = {
  bakers?: InputMaybe<Array<Scalars['String']['input']>>;
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
};


export type QueryNodesArgs = {
  limit: Scalars['Int']['input'];
  offset: Scalars['Int']['input'];
};

export type Settings = {
  __typename?: 'Settings';
  showSystemInfo: Scalars['Boolean']['output'];
};

export type SysInfo = {
  __typename?: 'SysInfo';
  cpu: CpuData;
  cpuTemperature: CpuTemperatureData;
  currentLoad: CurrentLoadData;
  fsSize: Array<Maybe<FsSizeData>>;
  fullLoad: Scalars['Float']['output'];
  inetLatency: Scalars['Float']['output'];
  mem: MemData;
  osInfo: OsData;
};

export type TezosNode = {
  __typename?: 'TezosNode';
  bootstrapped?: Maybe<Scalars['Boolean']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  peerCount?: Maybe<Scalars['Int']['output']>;
  recentBlocks: Array<BlockInfo>;
  synced?: Maybe<Scalars['String']['output']>;
  tezosVersion: TezosVersion;
  unableToReach?: Maybe<Scalars['Boolean']['output']>;
  updatedAt: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type TezosVersion = {
  __typename?: 'TezosVersion';
  chainName: Scalars['String']['output'];
  commitHash: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type TzAddressAlias = {
  __typename?: 'TzAddressAlias';
  address: Scalars['String']['output'];
  alias: Scalars['String']['output'];
};

export type GetNodesQueryVariables = Exact<{
  offset: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetNodesQuery = { __typename?: 'Query', nodes: { __typename?: 'Nodes', totalCount: number, items: Array<{ __typename?: 'TezosNode', url: string, name: string, error?: string | null, unableToReach?: boolean | null, synced?: string | null, updatedAt: string, peerCount?: number | null, recentBlocks: Array<{ __typename?: 'BlockInfo', protocol: string, hash: string, level: number, timestamp: string, priority?: number | null, payloadRound?: number | null }>, tezosVersion: { __typename?: 'TezosVersion', version: string, commitHash: string, chainName: string } }> } };

export type GetBakersQueryVariables = Exact<{
  offset: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetBakersQuery = { __typename?: 'Query', bakers: { __typename?: 'Bakers', totalCount: number, items: Array<{ __typename?: 'Baker', address: string, explorerUrl?: string | null, balance?: string | null, frozenBalance?: string | null, stakingBalance?: string | null, deactivated?: boolean | null, gracePeriod?: number | null, atRisk?: boolean | null, octezVersion?: string | null, blocksPerCycle: number, updatedAt: string, recentEvents: Array<{ __typename?: 'LevelEvents', level: number, explorerUrl?: string | null, cycle: number, timestamp: string, events: Array<{ __typename?: 'BakerEvent', kind: string, priority?: number | null, slotCount?: number | null }> }>, participation?: { __typename?: 'Participation', expected_cycle_activity: number, minimal_cycle_activity: number, missed_slots: number, missed_levels: number, remaining_allowed_missed_slots: number, expected_endorsing_rewards: string } | null, consensusKey?: { __typename?: 'ConsensusKey', active: string, explorerUrl?: string | null, pendings?: Array<{ __typename?: 'PendingConsensusKey', pkh: string, cycle: number }> | null } | null, lastProcessed?: { __typename?: 'LastProcessed', cyclePosition: number, cycle: number, level: number } | null }> } };

export type GetNetworkInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNetworkInfoQuery = { __typename?: 'Query', networkInfo?: { __typename?: 'NetworkInfo', chainName: string, protocol: string, level: number, cycle: number, cyclePosition: number, blocksPerCycle: number } | null };

export type GetSystemInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSystemInfoQuery = { __typename?: 'Query', pyrometer: { __typename?: 'PyrometerInfo', version: string, processes: Array<{ __typename?: 'ProcessInfo', cpu: number, mem: number, memRss: number, memVsz: number, pid: number, started: string, command: string, name: string, params?: string | null, user: string, path?: string | null }> }, sysInfo: { __typename?: 'SysInfo', fullLoad: number, cpu: { __typename?: 'CpuData', cores: number, brand: string, model: string, family: string, manufacturer: string }, currentLoad: { __typename?: 'CurrentLoadData', avgLoad: number }, cpuTemperature: { __typename?: 'CpuTemperatureData', cores: Array<number | null>, main?: number | null, max?: number | null, socket?: Array<number | null> | null, chipset?: number | null }, mem: { __typename?: 'MemData', total: number, active: number, swaptotal: number, swapused: number }, osInfo: { __typename?: 'OsData', arch?: string | null, build?: string | null, codename?: string | null, codepage?: string | null, distro?: string | null, fqdn?: string | null, hostname?: string | null, hypervizor?: boolean | null, kernel?: string | null, platform?: string | null, release?: string | null, servicepack?: string | null }, fsSize: Array<{ __typename?: 'FsSizeData', available: number, used: number, use: number, fs: string, mount: string, size: number, type: string } | null> } };

export type SettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type SettingsQuery = { __typename?: 'Query', settings: { __typename?: 'Settings', showSystemInfo: boolean } };

export type AliasesQueryVariables = Exact<{ [key: string]: never; }>;


export type AliasesQuery = { __typename?: 'Query', aliases: Array<{ __typename?: 'TzAddressAlias', alias: string, address: string }> };

export type BakerMonitorSettingsQueryVariables = Exact<{ [key: string]: never; }>;


export type BakerMonitorSettingsQuery = { __typename?: 'Query', bakerMonitorSettings: { __typename?: 'BakerMonitorSettings', rpc: string, maxCatchupBlocks: number, headDistance: number, missedThreshold: number } };

export type IsAdminConfiguredQueryVariables = Exact<{ [key: string]: never; }>;


export type IsAdminConfiguredQuery = { __typename?: 'Query', isAdminConfigured: boolean };

export type ConfiguredBakersQueryVariables = Exact<{ [key: string]: never; }>;


export type ConfiguredBakersQuery = { __typename?: 'Query', configuredBakers: Array<string> };

export type AuthenticateMutationVariables = Exact<{
  token: Scalars['String']['input'];
}>;


export type AuthenticateMutation = { __typename?: 'Mutation', authenticate: { __typename?: 'AuthResult', success: boolean, message?: string | null } };

export type AddBakerMutationVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type AddBakerMutation = { __typename?: 'Mutation', addBaker: { __typename?: 'MutationResult', success: boolean, message?: string | null } };

export type RemoveBakerMutationVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type RemoveBakerMutation = { __typename?: 'Mutation', removeBaker: { __typename?: 'MutationResult', success: boolean, message?: string | null } };

export type SetAliasMutationVariables = Exact<{
  address: Scalars['String']['input'];
  alias: Scalars['String']['input'];
}>;


export type SetAliasMutation = { __typename?: 'Mutation', setAlias: { __typename?: 'MutationResult', success: boolean, message?: string | null } };

export type RemoveAliasMutationVariables = Exact<{
  address: Scalars['String']['input'];
}>;


export type RemoveAliasMutation = { __typename?: 'Mutation', removeAlias: { __typename?: 'MutationResult', success: boolean, message?: string | null } };

export type UpdateBakerMonitorSettingsMutationVariables = Exact<{
  input: BakerMonitorSettingsInput;
}>;


export type UpdateBakerMonitorSettingsMutation = { __typename?: 'Mutation', updateBakerMonitorSettings: { __typename?: 'MutationResult', success: boolean, message?: string | null } };


export const GetNodesDocument = gql`
    query getNodes($offset: Int!, $limit: Int!) {
  nodes(offset: $offset, limit: $limit) {
    items {
      url
      name
      recentBlocks {
        protocol
        hash
        level
        timestamp
        priority
        payloadRound
      }
      tezosVersion {
        version
        commitHash
        chainName
      }
      error
      unableToReach
      synced
      updatedAt
      peerCount
    }
    totalCount
  }
}
    `;

/**
 * __useGetNodesQuery__
 *
 * To run a query within a React component, call `useGetNodesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNodesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNodesQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetNodesQuery(baseOptions: Apollo.QueryHookOptions<GetNodesQuery, GetNodesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetNodesQuery, GetNodesQueryVariables>(GetNodesDocument, options);
      }
export function useGetNodesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNodesQuery, GetNodesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetNodesQuery, GetNodesQueryVariables>(GetNodesDocument, options);
        }
export type GetNodesQueryHookResult = ReturnType<typeof useGetNodesQuery>;
export type GetNodesLazyQueryHookResult = ReturnType<typeof useGetNodesLazyQuery>;
export type GetNodesQueryResult = Apollo.QueryResult<GetNodesQuery, GetNodesQueryVariables>;
export const GetBakersDocument = gql`
    query getBakers($offset: Int!, $limit: Int!) {
  bakers(offset: $offset, limit: $limit) {
    items {
      address
      explorerUrl
      balance
      frozenBalance
      stakingBalance
      deactivated
      recentEvents {
        level
        explorerUrl
        cycle
        timestamp
        events {
          kind
          priority
          slotCount
        }
      }
      gracePeriod
      atRisk
      octezVersion
      participation {
        expected_cycle_activity
        minimal_cycle_activity
        missed_slots
        missed_levels
        remaining_allowed_missed_slots
        expected_endorsing_rewards
      }
      consensusKey {
        active
        explorerUrl
        pendings {
          pkh
          cycle
        }
      }
      lastProcessed {
        cyclePosition
        cycle
        level
      }
      blocksPerCycle
      updatedAt
    }
    totalCount
  }
}
    `;

/**
 * __useGetBakersQuery__
 *
 * To run a query within a React component, call `useGetBakersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBakersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBakersQuery({
 *   variables: {
 *      offset: // value for 'offset'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetBakersQuery(baseOptions: Apollo.QueryHookOptions<GetBakersQuery, GetBakersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetBakersQuery, GetBakersQueryVariables>(GetBakersDocument, options);
      }
export function useGetBakersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetBakersQuery, GetBakersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetBakersQuery, GetBakersQueryVariables>(GetBakersDocument, options);
        }
export type GetBakersQueryHookResult = ReturnType<typeof useGetBakersQuery>;
export type GetBakersLazyQueryHookResult = ReturnType<typeof useGetBakersLazyQuery>;
export type GetBakersQueryResult = Apollo.QueryResult<GetBakersQuery, GetBakersQueryVariables>;
export const GetNetworkInfoDocument = gql`
    query getNetworkInfo {
  networkInfo {
    chainName
    protocol
    level
    cycle
    cyclePosition
    blocksPerCycle
  }
}
    `;

/**
 * __useGetNetworkInfoQuery__
 *
 * To run a query within a React component, call `useGetNetworkInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNetworkInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNetworkInfoQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetNetworkInfoQuery(baseOptions?: Apollo.QueryHookOptions<GetNetworkInfoQuery, GetNetworkInfoQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetNetworkInfoQuery, GetNetworkInfoQueryVariables>(GetNetworkInfoDocument, options);
      }
export function useGetNetworkInfoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNetworkInfoQuery, GetNetworkInfoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetNetworkInfoQuery, GetNetworkInfoQueryVariables>(GetNetworkInfoDocument, options);
        }
export type GetNetworkInfoQueryHookResult = ReturnType<typeof useGetNetworkInfoQuery>;
export type GetNetworkInfoLazyQueryHookResult = ReturnType<typeof useGetNetworkInfoLazyQuery>;
export type GetNetworkInfoQueryResult = Apollo.QueryResult<GetNetworkInfoQuery, GetNetworkInfoQueryVariables>;
export const GetSystemInfoDocument = gql`
    query getSystemInfo {
  pyrometer {
    version
    processes {
      cpu
      mem
      memRss
      memVsz
      pid
      started
      command
      name
      params
      user
      path
    }
  }
  sysInfo {
    cpu {
      cores
      brand
      model
      family
      manufacturer
    }
    currentLoad {
      avgLoad
    }
    cpuTemperature {
      cores
      main
      max
      socket
      chipset
    }
    fullLoad
    mem {
      total
      active
      swaptotal
      swapused
    }
    osInfo {
      arch
      build
      codename
      codepage
      distro
      fqdn
      hostname
      hypervizor
      kernel
      platform
      release
      servicepack
    }
    fsSize {
      available
      used
      use
      fs
      mount
      size
      type
    }
  }
}
    `;

/**
 * __useGetSystemInfoQuery__
 *
 * To run a query within a React component, call `useGetSystemInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSystemInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSystemInfoQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSystemInfoQuery(baseOptions?: Apollo.QueryHookOptions<GetSystemInfoQuery, GetSystemInfoQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSystemInfoQuery, GetSystemInfoQueryVariables>(GetSystemInfoDocument, options);
      }
export function useGetSystemInfoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSystemInfoQuery, GetSystemInfoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSystemInfoQuery, GetSystemInfoQueryVariables>(GetSystemInfoDocument, options);
        }
export type GetSystemInfoQueryHookResult = ReturnType<typeof useGetSystemInfoQuery>;
export type GetSystemInfoLazyQueryHookResult = ReturnType<typeof useGetSystemInfoLazyQuery>;
export type GetSystemInfoQueryResult = Apollo.QueryResult<GetSystemInfoQuery, GetSystemInfoQueryVariables>;
export const SettingsDocument = gql`
    query settings {
  settings {
    showSystemInfo
  }
}
    `;

/**
 * __useSettingsQuery__
 *
 * To run a query within a React component, call `useSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useSettingsQuery(baseOptions?: Apollo.QueryHookOptions<SettingsQuery, SettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<SettingsQuery, SettingsQueryVariables>(SettingsDocument, options);
      }
export function useSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<SettingsQuery, SettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<SettingsQuery, SettingsQueryVariables>(SettingsDocument, options);
        }
export type SettingsQueryHookResult = ReturnType<typeof useSettingsQuery>;
export type SettingsLazyQueryHookResult = ReturnType<typeof useSettingsLazyQuery>;
export type SettingsQueryResult = Apollo.QueryResult<SettingsQuery, SettingsQueryVariables>;
export const AliasesDocument = gql`
    query aliases {
  aliases {
    alias
    address
  }
}
    `;

/**
 * __useAliasesQuery__
 *
 * To run a query within a React component, call `useAliasesQuery` and pass it any options that fit your needs.
 * When your component renders, `useAliasesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAliasesQuery({
 *   variables: {
 *   },
 * });
 */
export function useAliasesQuery(baseOptions?: Apollo.QueryHookOptions<AliasesQuery, AliasesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<AliasesQuery, AliasesQueryVariables>(AliasesDocument, options);
      }
export function useAliasesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<AliasesQuery, AliasesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<AliasesQuery, AliasesQueryVariables>(AliasesDocument, options);
        }
export type AliasesQueryHookResult = ReturnType<typeof useAliasesQuery>;
export type AliasesLazyQueryHookResult = ReturnType<typeof useAliasesLazyQuery>;
export type AliasesQueryResult = Apollo.QueryResult<AliasesQuery, AliasesQueryVariables>;
export const BakerMonitorSettingsDocument = gql`
    query bakerMonitorSettings {
  bakerMonitorSettings {
    rpc
    maxCatchupBlocks
    headDistance
    missedThreshold
  }
}
    `;

/**
 * __useBakerMonitorSettingsQuery__
 *
 * To run a query within a React component, call `useBakerMonitorSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useBakerMonitorSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useBakerMonitorSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useBakerMonitorSettingsQuery(baseOptions?: Apollo.QueryHookOptions<BakerMonitorSettingsQuery, BakerMonitorSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<BakerMonitorSettingsQuery, BakerMonitorSettingsQueryVariables>(BakerMonitorSettingsDocument, options);
      }
export function useBakerMonitorSettingsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<BakerMonitorSettingsQuery, BakerMonitorSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<BakerMonitorSettingsQuery, BakerMonitorSettingsQueryVariables>(BakerMonitorSettingsDocument, options);
        }
export type BakerMonitorSettingsQueryHookResult = ReturnType<typeof useBakerMonitorSettingsQuery>;
export type BakerMonitorSettingsLazyQueryHookResult = ReturnType<typeof useBakerMonitorSettingsLazyQuery>;
export type BakerMonitorSettingsQueryResult = Apollo.QueryResult<BakerMonitorSettingsQuery, BakerMonitorSettingsQueryVariables>;
export const IsAdminConfiguredDocument = gql`
    query isAdminConfigured {
  isAdminConfigured
}
    `;

/**
 * __useIsAdminConfiguredQuery__
 *
 * To run a query within a React component, call `useIsAdminConfiguredQuery` and pass it any options that fit your needs.
 * When your component renders, `useIsAdminConfiguredQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useIsAdminConfiguredQuery({
 *   variables: {
 *   },
 * });
 */
export function useIsAdminConfiguredQuery(baseOptions?: Apollo.QueryHookOptions<IsAdminConfiguredQuery, IsAdminConfiguredQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<IsAdminConfiguredQuery, IsAdminConfiguredQueryVariables>(IsAdminConfiguredDocument, options);
      }
export function useIsAdminConfiguredLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<IsAdminConfiguredQuery, IsAdminConfiguredQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<IsAdminConfiguredQuery, IsAdminConfiguredQueryVariables>(IsAdminConfiguredDocument, options);
        }
export type IsAdminConfiguredQueryHookResult = ReturnType<typeof useIsAdminConfiguredQuery>;
export type IsAdminConfiguredLazyQueryHookResult = ReturnType<typeof useIsAdminConfiguredLazyQuery>;
export type IsAdminConfiguredQueryResult = Apollo.QueryResult<IsAdminConfiguredQuery, IsAdminConfiguredQueryVariables>;
export const ConfiguredBakersDocument = gql`
    query configuredBakers {
  configuredBakers
}
    `;

/**
 * __useConfiguredBakersQuery__
 *
 * To run a query within a React component, call `useConfiguredBakersQuery` and pass it any options that fit your needs.
 * When your component renders, `useConfiguredBakersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useConfiguredBakersQuery({
 *   variables: {
 *   },
 * });
 */
export function useConfiguredBakersQuery(baseOptions?: Apollo.QueryHookOptions<ConfiguredBakersQuery, ConfiguredBakersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ConfiguredBakersQuery, ConfiguredBakersQueryVariables>(ConfiguredBakersDocument, options);
      }
export function useConfiguredBakersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ConfiguredBakersQuery, ConfiguredBakersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ConfiguredBakersQuery, ConfiguredBakersQueryVariables>(ConfiguredBakersDocument, options);
        }
export type ConfiguredBakersQueryHookResult = ReturnType<typeof useConfiguredBakersQuery>;
export type ConfiguredBakersLazyQueryHookResult = ReturnType<typeof useConfiguredBakersLazyQuery>;
export type ConfiguredBakersQueryResult = Apollo.QueryResult<ConfiguredBakersQuery, ConfiguredBakersQueryVariables>;
export const AuthenticateDocument = gql`
    mutation authenticate($token: String!) {
  authenticate(token: $token) {
    success
    message
  }
}
    `;
export type AuthenticateMutationFn = Apollo.MutationFunction<AuthenticateMutation, AuthenticateMutationVariables>;

/**
 * __useAuthenticateMutation__
 *
 * To run a mutation, you first call `useAuthenticateMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAuthenticateMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [authenticateMutation, { data, loading, error }] = useAuthenticateMutation({
 *   variables: {
 *      token: // value for 'token'
 *   },
 * });
 */
export function useAuthenticateMutation(baseOptions?: Apollo.MutationHookOptions<AuthenticateMutation, AuthenticateMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AuthenticateMutation, AuthenticateMutationVariables>(AuthenticateDocument, options);
      }
export type AuthenticateMutationHookResult = ReturnType<typeof useAuthenticateMutation>;
export type AuthenticateMutationResult = Apollo.MutationResult<AuthenticateMutation>;
export type AuthenticateMutationOptions = Apollo.BaseMutationOptions<AuthenticateMutation, AuthenticateMutationVariables>;
export const AddBakerDocument = gql`
    mutation addBaker($address: String!) {
  addBaker(address: $address) {
    success
    message
  }
}
    `;
export type AddBakerMutationFn = Apollo.MutationFunction<AddBakerMutation, AddBakerMutationVariables>;

/**
 * __useAddBakerMutation__
 *
 * To run a mutation, you first call `useAddBakerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddBakerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addBakerMutation, { data, loading, error }] = useAddBakerMutation({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useAddBakerMutation(baseOptions?: Apollo.MutationHookOptions<AddBakerMutation, AddBakerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddBakerMutation, AddBakerMutationVariables>(AddBakerDocument, options);
      }
export type AddBakerMutationHookResult = ReturnType<typeof useAddBakerMutation>;
export type AddBakerMutationResult = Apollo.MutationResult<AddBakerMutation>;
export type AddBakerMutationOptions = Apollo.BaseMutationOptions<AddBakerMutation, AddBakerMutationVariables>;
export const RemoveBakerDocument = gql`
    mutation removeBaker($address: String!) {
  removeBaker(address: $address) {
    success
    message
  }
}
    `;
export type RemoveBakerMutationFn = Apollo.MutationFunction<RemoveBakerMutation, RemoveBakerMutationVariables>;

/**
 * __useRemoveBakerMutation__
 *
 * To run a mutation, you first call `useRemoveBakerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveBakerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeBakerMutation, { data, loading, error }] = useRemoveBakerMutation({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useRemoveBakerMutation(baseOptions?: Apollo.MutationHookOptions<RemoveBakerMutation, RemoveBakerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveBakerMutation, RemoveBakerMutationVariables>(RemoveBakerDocument, options);
      }
export type RemoveBakerMutationHookResult = ReturnType<typeof useRemoveBakerMutation>;
export type RemoveBakerMutationResult = Apollo.MutationResult<RemoveBakerMutation>;
export type RemoveBakerMutationOptions = Apollo.BaseMutationOptions<RemoveBakerMutation, RemoveBakerMutationVariables>;
export const SetAliasDocument = gql`
    mutation setAlias($address: String!, $alias: String!) {
  setAlias(address: $address, alias: $alias) {
    success
    message
  }
}
    `;
export type SetAliasMutationFn = Apollo.MutationFunction<SetAliasMutation, SetAliasMutationVariables>;

/**
 * __useSetAliasMutation__
 *
 * To run a mutation, you first call `useSetAliasMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetAliasMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setAliasMutation, { data, loading, error }] = useSetAliasMutation({
 *   variables: {
 *      address: // value for 'address'
 *      alias: // value for 'alias'
 *   },
 * });
 */
export function useSetAliasMutation(baseOptions?: Apollo.MutationHookOptions<SetAliasMutation, SetAliasMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetAliasMutation, SetAliasMutationVariables>(SetAliasDocument, options);
      }
export type SetAliasMutationHookResult = ReturnType<typeof useSetAliasMutation>;
export type SetAliasMutationResult = Apollo.MutationResult<SetAliasMutation>;
export type SetAliasMutationOptions = Apollo.BaseMutationOptions<SetAliasMutation, SetAliasMutationVariables>;
export const RemoveAliasDocument = gql`
    mutation removeAlias($address: String!) {
  removeAlias(address: $address) {
    success
    message
  }
}
    `;
export type RemoveAliasMutationFn = Apollo.MutationFunction<RemoveAliasMutation, RemoveAliasMutationVariables>;

/**
 * __useRemoveAliasMutation__
 *
 * To run a mutation, you first call `useRemoveAliasMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveAliasMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeAliasMutation, { data, loading, error }] = useRemoveAliasMutation({
 *   variables: {
 *      address: // value for 'address'
 *   },
 * });
 */
export function useRemoveAliasMutation(baseOptions?: Apollo.MutationHookOptions<RemoveAliasMutation, RemoveAliasMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveAliasMutation, RemoveAliasMutationVariables>(RemoveAliasDocument, options);
      }
export type RemoveAliasMutationHookResult = ReturnType<typeof useRemoveAliasMutation>;
export type RemoveAliasMutationResult = Apollo.MutationResult<RemoveAliasMutation>;
export type RemoveAliasMutationOptions = Apollo.BaseMutationOptions<RemoveAliasMutation, RemoveAliasMutationVariables>;
export const UpdateBakerMonitorSettingsDocument = gql`
    mutation updateBakerMonitorSettings($input: BakerMonitorSettingsInput!) {
  updateBakerMonitorSettings(input: $input) {
    success
    message
  }
}
    `;
export type UpdateBakerMonitorSettingsMutationFn = Apollo.MutationFunction<UpdateBakerMonitorSettingsMutation, UpdateBakerMonitorSettingsMutationVariables>;

/**
 * __useUpdateBakerMonitorSettingsMutation__
 *
 * To run a mutation, you first call `useUpdateBakerMonitorSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBakerMonitorSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBakerMonitorSettingsMutation, { data, loading, error }] = useUpdateBakerMonitorSettingsMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdateBakerMonitorSettingsMutation(baseOptions?: Apollo.MutationHookOptions<UpdateBakerMonitorSettingsMutation, UpdateBakerMonitorSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateBakerMonitorSettingsMutation, UpdateBakerMonitorSettingsMutationVariables>(UpdateBakerMonitorSettingsDocument, options);
      }
export type UpdateBakerMonitorSettingsMutationHookResult = ReturnType<typeof useUpdateBakerMonitorSettingsMutation>;
export type UpdateBakerMonitorSettingsMutationResult = Apollo.MutationResult<UpdateBakerMonitorSettingsMutation>;
export type UpdateBakerMonitorSettingsMutationOptions = Apollo.BaseMutationOptions<UpdateBakerMonitorSettingsMutation, UpdateBakerMonitorSettingsMutationVariables>;