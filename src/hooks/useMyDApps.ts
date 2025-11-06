'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { placeholderDApps } from '@/lib/dapps';
import { getDAppsByDeployer } from '@/lib/dapps/management';
import { DAPP_REGISTRY_ABI } from '@/lib/contracts/abis';
import { getContractAddress, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useChainId } from 'wagmi';

export interface MyDApp extends DApp {
  dAppId?: number;
  isRegistered?: boolean;
  registeredAt?: Date;
}

/**
 * Hook to fetch all dApps owned by the connected wallet
 */
export function useMyDApps() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get DAppRegistry address
  const dAppRegistryAddress = useMemo(() => {
    try {
      if (typeof getContractAddress === 'function') {
        return getContractAddress(chainId, 'DAppRegistry') || '';
      }
    } catch (e) {
      console.warn('getContractAddress not available, using fallback');
    }

    if (CONTRACT_ADDRESSES) {
      if (chainId === 202555 && CONTRACT_ADDRESSES.kasplexL2Mainnet) {
        return CONTRACT_ADDRESSES.kasplexL2Mainnet.DAppRegistry || '';
      } else if (chainId === 167012 && CONTRACT_ADDRESSES.kasplexL2Testnet) {
        return CONTRACT_ADDRESSES.kasplexL2Testnet.DAppRegistry || '';
      }
    }
    return '';
  }, [chainId]);

  // Get total dApp count
  const { data: dAppCount, isLoading: isLoadingCount } = useReadContract({
    address: dAppRegistryAddress as `0x${string}`,
    abi: DAPP_REGISTRY_ABI,
    functionName: 'dAppCount',
    query: {
      enabled: !!dAppRegistryAddress && isConnected,
    },
  });

  // Get dApps from frontend data (placeholderDApps + localStorage)
  const frontendDApps = useMemo(() => {
    if (!isConnected || !address) {
      return [];
    }
    return getDAppsByDeployer(placeholderDApps, address);
  }, [isConnected, address]);

  // For now, we'll combine frontend dApps with contract data
  // In the future, we can fetch all registered dApps from the contract
  const myDApps: MyDApp[] = useMemo(() => {
    if (!isConnected || !address) {
      return [];
    }

    // Start with frontend dApps
    const dApps: MyDApp[] = frontendDApps.map((dapp) => ({
      ...dapp,
      isRegistered: !!dapp.contractAddress,
    }));

    return dApps;
  }, [frontendDApps, isConnected, address]);

  return {
    dApps: myDApps,
    isLoading: isLoadingCount,
    totalCount: dAppCount ? Number(dAppCount) : myDApps.length,
    isEmpty: myDApps.length === 0,
  };
}

