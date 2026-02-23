import { Tooltip, HStack, Icon, Text } from '@chakra-ui/react';
import React from 'react';
import { MdUpdate } from 'react-icons/md';
import { timestampFormat } from './format';

export default ({ updatedAt }: { updatedAt: string }) => {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const isStale = now - new Date(updatedAt).getTime() > 60000;
  const staleColor = isStale ? 'orange.500' : 'gray.400';

  return (
    <Tooltip label={isStale ? 'Last updated (data may be stale)' : 'Last updated'}>
      <HStack spacing={0.5}>
        <Icon as={MdUpdate} color={staleColor} />
        <Text color={staleColor} as="i" align="end">
          {timestampFormat.format(new Date(updatedAt))}
          {isStale && ' (stale)'}
        </Text>
      </HStack>
    </Tooltip>
  );
};
