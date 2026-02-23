import {
  HStack,
  Text,
  Tooltip,
  Box,
  VStack,
  Progress,
  Alert,
  AlertIcon,
  AlertDescription,
  WrapItem,
} from '@chakra-ui/react';
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
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

export default ({ isVisible = true }: { isVisible?: boolean }) => {
  const [filters, setFilters] = useState<BakerFilters | null>(null);

  const { data } = useGetNetworkInfoQuery({
    pollInterval: isVisible ? 15e3 : 0,
  });

  const networkInfo = data?.networkInfo;

  const { data: aliasesData } = useAliasesQuery();

  const aliasMap = useMemo(
    () => new Map(aliasesData?.aliases.map((x) => [x.address, x.alias])),
    [aliasesData],
  );

  // Track baker items from the render callback so we can extract versions
  const [bakerItems, setBakerItems] = useState<
    GetBakersQuery['bakers']['items']
  >([]);

  // Extract available versions dynamically from actual baker data
  const availableVersions = useMemo(() => {
    if (!bakerItems || bakerItems.length === 0) return [];
    const versions = new Set<string>();
    bakerItems.forEach((b) => {
      if (b.octezVersion) versions.add(b.octezVersion);
    });
    return Array.from(versions).sort();
  }, [bakerItems]);

  // Memoize the filtered baker items to avoid recomputing on every render
  const filteredBakerItems = useMemo(() => {
    if (!bakerItems || bakerItems.length === 0) return [];
    if (!filters) return bakerItems;

    return bakerItems.filter((baker) => {
      // Staking Balance filter
      if (
        (filters.minBalance !== undefined && filters.minBalance !== null) ||
        (filters.maxBalance !== undefined && filters.maxBalance !== null)
      ) {
        if (baker.stakingBalance) {
          const stakingBalanceTez = parseFloat(baker.stakingBalance) / 1e6;
          if (
            filters.minBalance !== null &&
            filters.minBalance !== undefined &&
            stakingBalanceTez < filters.minBalance
          ) {
            return false;
          }
          if (
            filters.maxBalance !== null &&
            filters.maxBalance !== undefined &&
            stakingBalanceTez > filters.maxBalance
          ) {
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
        const isHealthy = baker.recentEvents.some(
          (e) =>
            e.events?.some(
              (evt) => evt.kind === 'endorsed' || evt.kind === 'baked',
            ),
        );
        const matchesStatus = filters.status.some((status) => {
          if (status === 'deactivated' && baker.deactivated === true)
            return true;
          if (
            status === 'atRisk' &&
            baker.atRisk === true &&
            !baker.deactivated
          )
            return true;
          if (
            status === 'healthy' &&
            !baker.deactivated &&
            !baker.atRisk &&
            isHealthy
          )
            return true;
          if (
            status === 'unhealthy' &&
            !baker.deactivated &&
            !baker.atRisk &&
            !isHealthy
          )
            return true;
          return false;
        });
        if (!matchesStatus) return false;
      }

      return true;
    });
  }, [bakerItems, filters]);

  return (
    <VStack spacing={4} align="stretch">
      <PaginatedSection
        title="Bakers"
        storageNs="bakers"
        query={useGetBakersQuery}
        isVisible={isVisible}
        getCount={(data: GetBakersQuery) => data.bakers.totalCount}
        render={(
          { bakers: { items } }: GetBakersQuery,
          errors?: GraphQLErrors,
        ) => {
          // Update baker items for version extraction and filtering (only when items change)
          if (items !== bakerItems) {
            setBakerItems(items);
          }

          const errorsByItem = errors
            ? groupBy(
                errors.filter((x) => x.path && x.path[1] === 'items'),
                (x) => x.path && x.path[2],
              )
            : {};
          if (filteredBakerItems.length === 0 && items.length > 0) {
            return [
              <WrapItem key="empty-state" w="100%">
                <Alert status="info" borderRadius="md" w="100%">
                  <AlertIcon />
                  <AlertDescription>
                    No bakers match your filters. Try adjusting your criteria.
                  </AlertDescription>
                </Alert>
              </WrapItem>,
            ];
          }
          return filteredBakerItems.map((baker, index) => (
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
