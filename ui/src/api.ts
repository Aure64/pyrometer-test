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
  bakers: Bakers;
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