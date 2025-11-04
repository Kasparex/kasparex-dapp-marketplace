'use client';

import { useChainId, useAccount } from 'wagmi';
import { useMemo } from 'react';
import type { DApp } from '@/lib/dapps';
import { isDAppCompatibleWithChain, getDAppChainIds } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
interface NetworkCompatibilityResult {
  isCompatible: boolean;
  currentChainId: number | undefined;
  requiredChainIds: number[];
  currentChainName: string | null;
  requiredChainNames: string[];
  isWalletConnected: boolean;
  kaspaWalletConnected: boolean;
}

/**
 * Hook to check network compatibility between current wallet chain and dApp requirements
 * 
 * @param dapp - The dApp to check compatibility for (optional)
 * @returns NetworkCompatibilityResult with compatibility status and details
 */
export function useNetworkCompatibility(dapp?: DApp): NetworkCompatibilityResult {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { state: kaspaState } = useKaspaWallet();

  return useMemo(() => {
    const isWalletConnected = isConnected;
    const currentChainId = isWalletConnected ? chainId : undefined;
    const kaspaWalletConnected = kaspaState.isConnected;
    
    // If no dApp provided, return neutral state
    if (!dapp) {
      return {
        isCompatible: true,
        currentChainId,
        requiredChainIds: [],
        currentChainName: null,
        requiredChainNames: [],
        isWalletConnected,
        kaspaWalletConnected,
      };
    }

    const requiredChainIds = getDAppChainIds(dapp);

    // Standard EVM dApp compatibility check
    // If wallet not connected, consider incompatible (user needs to connect and switch)
    if (!isWalletConnected || currentChainId === undefined) {
      return {
        isCompatible: false,
        currentChainId: undefined,
        requiredChainIds,
        currentChainName: null,
        requiredChainNames: requiredChainIds.map(id => getChainById(id)?.name || `Chain ${id}`).filter(Boolean) as string[],
        isWalletConnected: false,
        kaspaWalletConnected,
      };
    }

    const isCompatible = isDAppCompatibleWithChain(dapp, currentChainId);
    const currentChainName = getChainById(currentChainId)?.name || null;
    const requiredChainNames = requiredChainIds
      .map(id => getChainById(id)?.name || `Chain ${id}`)
      .filter(Boolean) as string[];

    return {
      isCompatible,
      currentChainId,
      requiredChainIds,
      currentChainName,
      requiredChainNames,
      isWalletConnected,
      kaspaWalletConnected,
    };
  }, [dapp, chainId, isConnected, kaspaState.isConnected]);
}

