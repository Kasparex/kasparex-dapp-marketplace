'use client';

import { useChainId, useAccount } from 'wagmi';
import { useMemo } from 'react';
import type { DApp } from '@/lib/dapps';
import { isDAppCompatibleWithChain, isDAppKRC20Only, getDAppChainIds } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKRC20Balance } from './useKRC20Balance';

interface NetworkCompatibilityResult {
  isCompatible: boolean;
  currentChainId: number | undefined;
  requiredChainIds: number[];
  currentChainName: string | null;
  requiredChainNames: string[];
  isKRC20Only: boolean;
  isWalletConnected: boolean;
  requiredKRC20Tokens?: string[];
  hasRequiredKRC20Tokens?: boolean;
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
  
  // Get Kaspa address for balance checking
  const kaspaAddress = kaspaState.address ? kaspaState.address.replace(/^kaspa:/i, '') : undefined;
  
  // Fetch KRC-20 balances if Kaspa wallet is connected
  const { data: krc20Balances } = useKRC20Balance({
    address: kaspaAddress,
    enabled: !!kaspaAddress && kaspaState.isConnected,
  });

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
        isKRC20Only: false,
        isWalletConnected,
        kaspaWalletConnected,
      };
    }

    const isKRC20Only = isDAppKRC20Only(dapp);
    const requiredChainIds = getDAppChainIds(dapp);
    const requiredKRC20Tokens = dapp.supportedKRC20Tokens;
    
    // Check if user has required KRC-20 tokens
    let hasRequiredKRC20Tokens = true; // Default to true if no tokens required
    if (requiredKRC20Tokens && requiredKRC20Tokens.length > 0) {
      if (!kaspaWalletConnected || !krc20Balances) {
        hasRequiredKRC20Tokens = false;
      } else {
        // Check if user has at least one of the required tokens
        const userTokenSymbols = krc20Balances.map(b => b.symbol.toUpperCase());
        hasRequiredKRC20Tokens = requiredKRC20Tokens.some(requiredToken =>
          userTokenSymbols.includes(requiredToken.toUpperCase())
        );
      }
    }
    
    // KRC-20 only dApps require Kaspa wallet and optionally specific tokens
    if (isKRC20Only) {
      const isCompatible = kaspaWalletConnected && hasRequiredKRC20Tokens;
      return {
        isCompatible,
        currentChainId,
        requiredChainIds: [],
        currentChainName: currentChainId ? getChainById(currentChainId)?.name || null : null,
        requiredChainNames: [],
        isKRC20Only: true,
        isWalletConnected,
        requiredKRC20Tokens,
        hasRequiredKRC20Tokens,
        kaspaWalletConnected,
      };
    }

    // EVM dApps with KRC-20 token requirements
    if (requiredKRC20Tokens && requiredKRC20Tokens.length > 0) {
      // Need both EVM wallet (for EVM chain) AND Kaspa wallet (for KRC-20 tokens)
      const isCompatible = 
        isWalletConnected && 
        currentChainId !== undefined &&
        isDAppCompatibleWithChain(dapp, currentChainId) &&
        kaspaWalletConnected &&
        hasRequiredKRC20Tokens;
      
      return {
        isCompatible,
        currentChainId,
        requiredChainIds,
        currentChainName: currentChainId ? getChainById(currentChainId)?.name || null : null,
        requiredChainNames: requiredChainIds
          .map(id => getChainById(id)?.name || `Chain ${id}`)
          .filter(Boolean) as string[],
        isKRC20Only: false,
        isWalletConnected,
        requiredKRC20Tokens,
        hasRequiredKRC20Tokens,
        kaspaWalletConnected,
      };
    }

    // Standard EVM dApp (no KRC-20 requirements)
    // If wallet not connected, consider incompatible (user needs to connect and switch)
    if (!isWalletConnected || currentChainId === undefined) {
      return {
        isCompatible: false,
        currentChainId: undefined,
        requiredChainIds,
        currentChainName: null,
        requiredChainNames: requiredChainIds.map(id => getChainById(id)?.name || `Chain ${id}`).filter(Boolean) as string[],
        isKRC20Only: false,
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
      isKRC20Only: false,
      isWalletConnected,
      kaspaWalletConnected,
    };
  }, [dapp, chainId, isConnected, kaspaState.isConnected, kaspaState.address, krc20Balances]);
}

