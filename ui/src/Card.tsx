import { Box, Divider, VStack, useColorModeValue } from '@chakra-ui/react';
import React from 'react';

export default ({
  children,
  minHeight,
}: {
  children: Array<React.ReactNode>;
  minHeight?: string;
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');

  return (
  <Box
    borderWidth="1px"
    rounded="md"
    padding="10px"
    minW={{ base: "100%", sm: "340px" }}
    maxW={{ base: "100%", sm: "360px" }}
    minHeight={minHeight || '195px'}
    marginRight="10px"
    marginBottom="10px"
    bg={cardBg}
  >
    <VStack w="100%" align="flex-start">
      {children[0]}
      <Box w="100%">{children[1]}</Box>
      <Divider />
      <Box w="100%" fontSize="xs">
        {children[2]}
      </Box>
    </VStack>
  </Box>
  );
};
