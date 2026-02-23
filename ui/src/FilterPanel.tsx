import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Collapse,
  Divider,
  HStack,
  Icon,
  Input,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { MdFilterList, MdClear } from 'react-icons/md';

export interface BakerFilters {
  status?: string[];
  minBalance?: number | null;
  maxBalance?: number | null;
  octezVersions?: string[];
  deactivated?: boolean | null;
  atRisk?: boolean | null;
}

interface FilterPanelProps {
  onFiltersChange: (filters: BakerFilters | null) => void;
  availableVersions?: string[];
}

const MAX_BALANCE_TEZ = 1_000_000_000; // 1 billion Tez

const BALANCE_RANGES = [
  { label: '< 50k', min: null, max: 50_000 },
  { label: '50k - 250k', min: 50_000, max: 250_000 },
  { label: '250k - 500k', min: 250_000, max: 500_000 },
  { label: '500k - 1M', min: 500_000, max: 1_000_000 },
  { label: '> 1M', min: 1_000_000, max: null },
];

const STATUS_OPTIONS = [
  { value: 'healthy', label: 'Healthy (Active & Up)', color: 'green' },
  { value: 'unhealthy', label: 'Unhealthy (Active but Down)', color: 'orange' },
  { value: 'atRisk', label: 'At Risk (Deactivation)', color: 'red' },
  { value: 'deactivated', label: 'Deactivated', color: 'gray' },
];

export default function FilterPanel({
  onFiltersChange,
  availableVersions = [],
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedBalanceRange, setSelectedBalanceRange] = useState<number | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  // Propagate filter changes to parent in real-time
  useEffect(() => {
    const filters: BakerFilters = {};

    // Status filter
    if (selectedStatuses.length > 0) {
      filters.status = selectedStatuses;
    }

    // Balance filter
    if (selectedBalanceRange !== null) {
      const range = BALANCE_RANGES[selectedBalanceRange];
      if (range.min !== null) {
        filters.minBalance = range.min;
      }
      if (range.max !== null) {
        filters.maxBalance = range.max;
      }
    }

    // Version filter
    if (selectedVersions.length > 0) {
      filters.octezVersions = selectedVersions;
    }

    onFiltersChange(Object.keys(filters).length > 0 ? filters : null);
  }, [selectedStatuses, selectedBalanceRange, selectedVersions, onFiltersChange]);

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedBalanceRange(null);
    setSelectedVersions([]);
  };

  const hasActiveFilters =
    selectedStatuses.length > 0 ||
    selectedBalanceRange !== null ||
    selectedVersions.length > 0;

  // Extract major versions from available versions
  const majorVersions = Array.from(
    new Set(
      availableVersions
        .filter((v) => v && v.startsWith('v'))
        .map((v) => {
          const match = v.match(/^v\d+/);
          return match ? match[0] : null;
        })
        .filter((v): v is string => v !== null),
    ),
  ).sort((a, b) => {
    const aNum = parseInt(a.substring(1));
    const bNum = parseInt(b.substring(1));
    return bNum - aNum; // Descending order
  });

  return (
    <Box width="100%" mb={4}>
      <HStack mb={2}>
        <Button
          size="sm"
          leftIcon={<Icon as={MdFilterList} />}
          onClick={() => setIsOpen(!isOpen)}
          colorScheme={hasActiveFilters ? 'blue' : 'gray'}
          variant={hasActiveFilters ? 'solid' : 'outline'}
        >
          Filters {hasActiveFilters && `(${selectedStatuses.length + (selectedBalanceRange !== null ? 1 : 0) + selectedVersions.length})`}
        </Button>
        {hasActiveFilters && (
          <Button
            size="sm"
            leftIcon={<Icon as={MdClear} />}
            onClick={clearFilters}
            variant="ghost"
          >
            Clear All
          </Button>
        )}
      </HStack>

      <Collapse in={isOpen} animateOpacity>
        <Box
          p={4}
          borderWidth={1}
          borderRadius="md"
          bg="whiteAlpha.50"
          borderColor="whiteAlpha.200"
        >
          <VStack align="stretch" spacing={4}>
            {/* Status Filter */}
            <Box>
              <Text fontWeight="bold" mb={2} fontSize="sm">
                Status
              </Text>
              <Wrap spacing={2}>
                {STATUS_OPTIONS.map((option) => (
                  <WrapItem key={option.value}>
                    <Checkbox
                      isChecked={selectedStatuses.includes(option.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStatuses([...selectedStatuses, option.value]);
                        } else {
                          setSelectedStatuses(
                            selectedStatuses.filter((s) => s !== option.value),
                          );
                        }
                      }}
                      colorScheme={option.color}
                      size="sm"
                    >
                      {option.label}
                    </Checkbox>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>

            <Divider />

            {/* Balance Filter */}
            <Box>
              <Text fontWeight="bold" mb={2} fontSize="sm">
                Balance (Tez)
              </Text>
              <Wrap spacing={2}>
                {BALANCE_RANGES.map((range, index) => (
                  <WrapItem key={index}>
                    <Button
                      size="sm"
                      variant={
                        selectedBalanceRange === index ? 'solid' : 'outline'
                      }
                      colorScheme={
                        selectedBalanceRange === index ? 'blue' : 'gray'
                      }
                      onClick={() => {
                        setSelectedBalanceRange(
                          selectedBalanceRange === index ? null : index,
                        );
                      }}
                    >
                      {range.label}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>

            <Divider />

            {/* Octez Version Filter */}
            <Box>
              <Text fontWeight="bold" mb={2} fontSize="sm">
                Octez Version
              </Text>
              <Wrap spacing={2}>
                {majorVersions.length > 0 ? (
                  majorVersions.map((version) => (
                    <WrapItem key={version}>
                      <Button
                        size="sm"
                        variant={
                          selectedVersions.includes(version) ? 'solid' : 'outline'
                        }
                        colorScheme={
                          selectedVersions.includes(version) ? 'purple' : 'gray'
                        }
                        onClick={() => {
                          if (selectedVersions.includes(version)) {
                            setSelectedVersions(
                              selectedVersions.filter((v) => v !== version),
                            );
                          } else {
                            setSelectedVersions([...selectedVersions, version]);
                          }
                        }}
                      >
                        {version}.x
                      </Button>
                    </WrapItem>
                  ))
                ) : (
                  <Text fontSize="xs" color="whiteAlpha.600">
                    No version data available
                  </Text>
                )}
              </Wrap>
            </Box>

            <Divider />

            {/* Reset Button */}
            <HStack justify="flex-end">
              <Button size="sm" onClick={clearFilters} variant="ghost">
                Reset
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}

