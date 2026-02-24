import React, { useState, useMemo } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Input,
  Button,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Divider,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { MdDelete, MdEdit, MdLock, MdLockOpen } from 'react-icons/md';
import { useAuth } from './AuthContext';
import {
  useAliasesQuery,
  useConfiguredBakersQuery,
  useBakerMonitorSettingsQuery,
  useIsAdminConfiguredQuery,
  useAddBakerMutation,
  useRemoveBakerMutation,
  useSetAliasMutation,
  useRemoveAliasMutation,
  useUpdateBakerMonitorSettingsMutation,
} from './api';

const isValidTzAddress = (addr: string) =>
  /^tz[1-4][1-9A-HJ-NP-Za-km-z]{33}$/.test(addr) || addr === '*';

export default function Settings() {
  const toast = useToast();
  const { isAuthenticated, login, logout } = useAuth();
  const {
    isOpen: isAuthOpen,
    onOpen: onAuthOpen,
    onClose: onAuthClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [authToken, setAuthToken] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const { data: adminData } = useIsAdminConfiguredQuery();
  const { data: bakersData, refetch: refetchBakers } =
    useConfiguredBakersQuery();
  const { data: aliasesData, refetch: refetchAliases } = useAliasesQuery();
  const { data: settingsData, refetch: refetchSettings } =
    useBakerMonitorSettingsQuery();

  const [addBaker] = useAddBakerMutation();
  const [removeBaker] = useRemoveBakerMutation();
  const [setAlias] = useSetAliasMutation();
  const [removeAlias] = useRemoveAliasMutation();
  const [updateSettings] = useUpdateBakerMonitorSettingsMutation();

  const [newBakerAddress, setNewBakerAddress] = useState('');
  const [newBakerAlias, setNewBakerAlias] = useState('');
  const [editingAlias, setEditingAlias] = useState<{
    address: string;
    alias: string;
  } | null>(null);
  const [deletingBaker, setDeletingBaker] = useState<string | null>(null);

  const [rpc, setRpc] = useState('');
  const [maxCatchup, setMaxCatchup] = useState('');
  const [headDist, setHeadDist] = useState('');
  const [missedThresh, setMissedThresh] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  React.useEffect(() => {
    if (settingsData?.bakerMonitorSettings && !settingsLoaded) {
      const s = settingsData.bakerMonitorSettings;
      setRpc(s.rpc);
      setMaxCatchup(String(s.maxCatchupBlocks));
      setHeadDist(String(s.headDistance));
      setMissedThresh(String(s.missedThreshold));
      setSettingsLoaded(true);
    }
  }, [settingsData, settingsLoaded]);

  const aliasMap = useMemo(
    () => new Map(aliasesData?.aliases.map((x) => [x.address, x.alias])),
    [aliasesData],
  );

  const configuredBakers = bakersData?.configuredBakers ?? [];
  const isAdminConfigured = adminData?.isAdminConfigured ?? false;

  const handleAuth = async () => {
    setAuthLoading(true);
    const success = await login(authToken);
    setAuthLoading(false);
    if (success) {
      toast({ title: 'Authenticated', status: 'success', duration: 2000 });
      onAuthClose();
      setAuthToken('');
    } else {
      toast({ title: 'Invalid token', status: 'error', duration: 2000 });
    }
  };

  const handleAddBaker = async () => {
    if (!isValidTzAddress(newBakerAddress)) {
      toast({
        title: 'Invalid address format',
        status: 'error',
        duration: 2000,
      });
      return;
    }
    const { data } = await addBaker({
      variables: { address: newBakerAddress },
    });
    if (data?.addBaker.success) {
      if (newBakerAlias) {
        await setAlias({
          variables: { address: newBakerAddress, alias: newBakerAlias },
        });
      }
      toast({ title: 'Baker added', status: 'success', duration: 2000 });
      setNewBakerAddress('');
      setNewBakerAlias('');
      refetchBakers();
      refetchAliases();
    } else {
      toast({
        title: data?.addBaker.message || 'Error',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const handleRemoveBaker = async () => {
    if (!deletingBaker) return;
    const { data } = await removeBaker({
      variables: { address: deletingBaker },
    });
    if (data?.removeBaker.success) {
      toast({ title: 'Baker removed', status: 'success', duration: 2000 });
      refetchBakers();
    } else {
      toast({
        title: data?.removeBaker.message || 'Error',
        status: 'error',
        duration: 2000,
      });
    }
    setDeletingBaker(null);
    onDeleteClose();
  };

  const handleSaveAlias = async () => {
    if (!editingAlias) return;
    if (editingAlias.alias) {
      await setAlias({
        variables: {
          address: editingAlias.address,
          alias: editingAlias.alias,
        },
      });
    } else {
      await removeAlias({ variables: { address: editingAlias.address } });
    }
    toast({ title: 'Alias updated', status: 'success', duration: 2000 });
    setEditingAlias(null);
    refetchAliases();
  };

  const handleSaveSettings = async () => {
    const { data } = await updateSettings({
      variables: {
        input: {
          rpc: rpc || undefined,
          max_catchup_blocks: maxCatchup ? parseInt(maxCatchup) : undefined,
          head_distance: headDist ? parseInt(headDist) : undefined,
          missed_threshold: missedThresh ? parseInt(missedThresh) : undefined,
        },
      },
    });
    if (data?.updateBakerMonitorSettings.success) {
      toast({ title: 'Settings saved', status: 'success', duration: 2000 });
      refetchSettings();
    } else {
      toast({
        title: data?.updateBakerMonitorSettings.message || 'Error',
        status: 'error',
        duration: 2000,
      });
    }
  };

  return (
    <VStack align="stretch" spacing={6} w="100%">
      <HStack justify="space-between">
        <Heading size="md">Settings</Heading>
        {isAdminConfigured &&
          (isAuthenticated ? (
            <Button
              size="sm"
              leftIcon={<MdLockOpen />}
              onClick={logout}
              variant="outline"
            >
              Logout
            </Button>
          ) : (
            <Button
              size="sm"
              leftIcon={<MdLock />}
              onClick={onAuthOpen}
              colorScheme="blue"
            >
              Unlock
            </Button>
          ))}
        {!isAdminConfigured && (
          <Tooltip label="Set admin_token in pyrometer.toml [ui] section to enable editing">
            <Badge colorScheme="gray">Read-only</Badge>
          </Tooltip>
        )}
      </HStack>

      <Box>
        <Heading size="sm" mb={3}>
          Monitored Bakers
        </Heading>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Address</Th>
              <Th>Alias</Th>
              {isAuthenticated && <Th w="100px">Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {configuredBakers.map((address) => (
              <Tr key={address}>
                <Td fontFamily="mono" fontSize="sm">
                  {address}
                </Td>
                <Td>
                  {editingAlias?.address === address ? (
                    <HStack>
                      <Input
                        size="sm"
                        value={editingAlias.alias}
                        onChange={(e) =>
                          setEditingAlias({
                            ...editingAlias,
                            alias: e.target.value,
                          })
                        }
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleSaveAlias()
                        }
                      />
                      <Button size="sm" onClick={handleSaveAlias}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingAlias(null)}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  ) : (
                    <Text fontSize="sm">{aliasMap.get(address) || '-'}</Text>
                  )}
                </Td>
                {isAuthenticated && (
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        aria-label="Edit alias"
                        icon={<MdEdit />}
                        size="xs"
                        variant="ghost"
                        onClick={() =>
                          setEditingAlias({
                            address,
                            alias: aliasMap.get(address) || '',
                          })
                        }
                      />
                      <IconButton
                        aria-label="Remove baker"
                        icon={<MdDelete />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          setDeletingBaker(address);
                          onDeleteOpen();
                        }}
                      />
                    </HStack>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>

        {isAuthenticated && (
          <HStack mt={3} spacing={2}>
            <FormControl
              isInvalid={
                newBakerAddress.length > 0 && !isValidTzAddress(newBakerAddress)
              }
              maxW="400px"
            >
              <Input
                size="sm"
                placeholder="tz1... address"
                value={newBakerAddress}
                onChange={(e) => setNewBakerAddress(e.target.value)}
              />
              <FormErrorMessage>Invalid address format</FormErrorMessage>
            </FormControl>
            <Input
              size="sm"
              placeholder="Alias (optional)"
              value={newBakerAlias}
              onChange={(e) => setNewBakerAlias(e.target.value)}
              maxW="200px"
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleAddBaker}
              isDisabled={!newBakerAddress}
            >
              Add
            </Button>
          </HStack>
        )}
      </Box>

      <Divider />

      <Box>
        <Heading size="sm" mb={3}>
          Monitoring Configuration
        </Heading>
        <VStack align="stretch" spacing={3} maxW="500px">
          <FormControl>
            <FormLabel fontSize="sm">RPC Endpoint</FormLabel>
            <Input
              size="sm"
              value={rpc}
              onChange={(e) => setRpc(e.target.value)}
              isReadOnly={!isAuthenticated}
            />
          </FormControl>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Max Catchup Blocks</FormLabel>
              <Input
                size="sm"
                type="number"
                value={maxCatchup}
                onChange={(e) => setMaxCatchup(e.target.value)}
                isReadOnly={!isAuthenticated}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Head Distance</FormLabel>
              <Input
                size="sm"
                type="number"
                value={headDist}
                onChange={(e) => setHeadDist(e.target.value)}
                isReadOnly={!isAuthenticated}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Missed Threshold</FormLabel>
              <Input
                size="sm"
                type="number"
                value={missedThresh}
                onChange={(e) => setMissedThresh(e.target.value)}
                isReadOnly={!isAuthenticated}
              />
            </FormControl>
          </HStack>
          {isAuthenticated && (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleSaveSettings}
              alignSelf="flex-start"
            >
              Save Settings
            </Button>
          )}
        </VStack>
      </Box>

      <Modal isOpen={isAuthOpen} onClose={onAuthClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Admin Authentication</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Admin Token</FormLabel>
              <Input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Enter your admin token"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAuthClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAuth}
              isLoading={authLoading}
            >
              Unlock
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Remove Baker</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to stop monitoring <b>{deletingBaker}</b>?
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleRemoveBaker}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
