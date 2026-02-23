import React from 'react';

import { Box, Text, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { formatRelativeTime, timestampFormat } from './format';

export default ({
  children,
  highlight,
  timestamp,
}: {
  children: React.ReactNode;
  highlight: boolean;
  timestamp: Date;
}) => {
  const highlightColor = useColorModeValue('black', 'white');
  const normalColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      display="flex"
      w="100%"
      justifyContent="space-between"
      alignItems="baseline"
      fontWeight={highlight ? 'bold' : 'normal'}
      color={highlight ? highlightColor : normalColor}
    >
      {children}
      <Tooltip label={timestampFormat.format(timestamp)}>
        <Text fontSize="xs" fontFamily="monospace">
          {formatRelativeTime(timestamp.getTime())}
        </Text>
      </Tooltip>
    </Box>
  );
};
