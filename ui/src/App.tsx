import {
  VStack,
  HStack,
  IconButton,
  useColorMode,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import React from 'react';
import { MdDarkMode, MdLightMode, MdSettings } from 'react-icons/md';
import SystemInfo from './SystemInfo';
import Bakers from './Bakers';
import Nodes from './Nodes';
import Settings from './Settings';
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
      <Tabs w="100%" variant="enclosed" isLazy>
        <HStack w="100%" justifyContent="space-between">
          <TabList>
            <Tab>Bakers</Tab>
            <Tab>Nodes</Tab>
            <Tab>
              <MdSettings style={{ marginRight: 4 }} /> Settings
            </Tab>
          </TabList>
          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === 'dark' ? <MdLightMode /> : <MdDarkMode />}
            onClick={toggleColorMode}
            variant="ghost"
            size="sm"
          />
        </HStack>
        <TabPanels>
          <TabPanel px={0}>
            <Bakers isVisible={isVisible} />
            {data?.settings.showSystemInfo && <SystemInfo />}
          </TabPanel>
          <TabPanel px={0}>
            <Nodes isVisible={isVisible} />
          </TabPanel>
          <TabPanel px={0}>
            <Settings />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

export default App;
