import { HStack, Text, Tooltip, Box, VStack, Progress, Alert, AlertIcon, AlertDescription, WrapItem } from '@chakra-ui/react';
import React, { useState, useMemo, useEffect } from 'react';
import {
  useGetBakersQuery,
  useGetNetworkInfoQuery,
  GetBakersQuery,
  useAliasesQuery,
} from './api';
import BakerCard from './BakerCard';
import { takeStart } from './format';
import PaginatedSection from './PaginatedSection';
import { CircularProgress, CircularProgressLabel } from '@chakra-ui/react';
import type { GraphQLErrors } from '@apollo/client/errors';
import FilterPanel, { type BakerFilters } from './FilterPanel';

import { groupBy } from 'lodash';

const InfoItem = ({
  text,
  tooltip,
  fontSize = 'small',
}: {
  text: string | number | undefined | null;
  tooltip: string | undefined;
  fontSize?: string;
}) => (
  <Tooltip label={tooltip}>
    <Text fontSize={fontSize} fontFamily="mono">
      {text}
    </Text>
  </Tooltip>
);

export default () => {
  const [filters, setFilters] = useState<BakerFilters | null>(null);
  
  const { data } = useGetNetworkInfoQuery({
    pollInterval: 15e3,
  });

  const networkInfo = data?.networkInfo;

  const { data: aliasesData } = useAliasesQuery();

  const aliasMap = new Map(
    aliasesData?.aliases.map((x) => [x.address, x.alias]),
  );

  // Extract available versions from all bakers for filter options
  const availableVersions = useMemo(() => {
    // This will be populated from the actual baker data
    // For now, we'll use common versions
    return ['v19.0', 'v19.1', 'v20.0', 'v21.0', 'v22.0', 'v23.0', 'v23.1', 'v23.2'];
  }, []);

  return (
    <VStack spacing={4} align="stretch">
      <PaginatedSection
        title="Bakers"
        storageNs="bakers"
        query={useGetBakersQuery}
        getCount={(data: GetBakersQuery) => data.bakers.totalCount}
        render={(
          { bakers: { items } }: GetBakersQuery,
          errors?: GraphQLErrors,
        ) => {
          // Apply ALL filters on frontend
          let filteredItems = items;
          
          if (filters) {
            filteredItems = items.filter((baker) => {
              // Staking Balance filter
              if ((filters.minBalance !== undefined && filters.minBalance !== null) || 
                  (filters.maxBalance !== undefined && filters.maxBalance !== null)) {
                // If staking balance not loaded yet, keep the baker
                if (baker.stakingBalance) {
                  const stakingBalanceTez = parseFloat(baker.stakingBalance) / 1e6;
                  if (filters.minBalance !== null && filters.minBalance !== undefined && stakingBalanceTez < filters.minBalance) {
                    return false;
                  }
                  if (filters.maxBalance !== null && filters.maxBalance !== undefined && stakingBalanceTez > filters.maxBalance) {
                    return false;
                  }
                }
              }

              // Octez version filter
              if (filters.octezVersions && filters.octezVersions.length > 0) {
                if (!baker.octezVersion) return false;
                const matchesVersion = filters.octezVersions.some((filterVer) => {
                  return baker.octezVersion?.startsWith(filterVer || '');
                });
                if (!matchesVersion) return false;
              }

              // Status filter
              if (filters.status && filters.status.length > 0) {
                const isHealthy = baker.recentEvents.some((e) =>
                  e.events?.some((evt) => evt.kind === 'endorsed' || evt.kind === 'baked')
                );
                const matchesStatus = filters.status.some((status) => {
                  if (status === 'deactivated' && baker.deactivated === true) return true;
                  if (status === 'atRisk' && baker.atRisk === true && !baker.deactivated) return true;
                  if (status === 'healthy' && !baker.deactivated && !baker.atRisk && isHealthy) return true;
                  if (status === 'unhealthy' && !baker.deactivated && !baker.atRisk && !isHealthy) return true;
                  return false;
                });
                if (!matchesStatus) return false;
              }

              return true;
            });
          }

          const errorsByItem = errors
            ? groupBy(
                errors.filter((x) => x.path && x.path[1] === 'items'),
                (x) => x.path && x.path[2],
              )
            : {};
          return filteredItems.map((baker, index) => (
            <WrapItem key={baker.address}>
              <BakerCard
                baker={baker}
                errors={errorsByItem[index]}
                aliasMap={aliasMap}
              />
            </WrapItem>
          ));
        }}
        renderSubHeader={() => {
          return (
            <VStack align="stretch" spacing={2} width="100%">
              {networkInfo && (
                <HStack flexWrap="wrap">
                  <Tooltip label={`Cycle ${networkInfo.cycle}`}>
                    <Box>
                      <CircularProgress
                        value={
                          (100 * networkInfo.cyclePosition) /
                          networkInfo.blocksPerCycle
                        }
                        color="green.400"
                        size="30px"
                      >
                        <CircularProgressLabel fontSize="0.3em">
                          {networkInfo.cycle}
                        </CircularProgressLabel>
                      </CircularProgress>
                    </Box>
                  </Tooltip>
                  <InfoItem tooltip="Level" text={networkInfo.level} />
                  <InfoItem tooltip="Chain name" text={networkInfo.chainName} />
                  <InfoItem
                    tooltip="Current protocol"
                    text={takeStart(networkInfo.protocol, 12)}
                  />
                </HStack>
              )}
              <FilterPanel
                onFiltersChange={setFilters}
                availableVersions={availableVersions}
              />
            </VStack>
          );
        }}
      />
    </VStack>
  );
};
