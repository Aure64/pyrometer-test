import { VStack, HStack, IconButton, useColorMode } from '@chakra-ui/react';
import React from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import SystemInfo from './SystemInfo';
import Bakers from './Bakers';
import Nodes from './Nodes';
import { useSettingsQuery } from './api';

interface AppProps {}

function App({}: AppProps) {
  const { data } = useSettingsQuery();
  const { colorMode, toggleColorMode } = useColorMode();

  const [isVisible, setIsVisible] = React.useState(!document.hidden);

  React.useEffect(() => {
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return (
    <VStack p="20px" alignItems="flex-start" w="100%">
      <HStack w="100%" justifyContent="flex-end">
        <IconButton
          aria-label="Toggle dark mode"
          icon={colorMode === 'dark' ? <MdLightMode /> : <MdDarkMode />}
          onClick={toggleColorMode}
          variant="ghost"
          size="sm"
        />
      </HStack>
      <Bakers isVisible={isVisible} />
      <Nodes isVisible={isVisible} />
      {data?.settings.showSystemInfo && <SystemInfo />}
    </VStack>
  );
}

export default App;
