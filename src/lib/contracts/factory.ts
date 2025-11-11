/**
 * Contract Factory Pattern
 * Switches between EVM and vProgs based on network
 */

'use client';

import { useChainId } from 'wagmi';
import { useEVMContracts } from './evm';
import { useVProgsContracts } from './vprogs';
import type { ContractAbstraction } from './abstraction';

/**
 * vProgs network IDs (to be defined when vProgs launches)
 */
export const VPROGS_NETWORK_IDS = {
  TESTNET: 999999, // Placeholder
  MAINNET: 999998, // Placeholder
};

/**
 * Check if current network is vProgs
 */
export function isVProgsNetwork(chainId: number): boolean {
  return Object.values(VPROGS_NETWORK_IDS).includes(chainId);
}

/**
 * Hook to get appropriate contract abstraction based on network
 * Note: Always calls both hooks to satisfy React Hooks rules
 */
export function useContractFactory(): {
  abstraction: ContractAbstraction;
  networkType: 'evm' | 'vprogs';
  chainId: number;
} {
  const chainId = useChainId();
  const isVProgs = isVProgsNetwork(chainId);
  
  // Always call hooks unconditionally (React Hooks rules)
  const vprogs = useVProgsContracts();
  const evm = useEVMContracts();

  // Return the appropriate abstraction based on network
  if (isVProgs) {
    return {
      abstraction: vprogs.abstraction,
      networkType: 'vprogs',
      chainId,
    };
  } else {
    return {
      abstraction: evm.abstraction,
      networkType: 'evm',
      chainId,
    };
  }
}

/**
 * Get contract abstraction for a specific network
 * Note: This is a utility function, not a hook. It cannot use hooks.
 * Use useContractFactory() hook instead for React components.
 */
export function getContractAbstraction(chainId: number): ContractAbstraction | null {
  // This function cannot use hooks - it's a utility function
  // For React components, use useContractFactory() instead
  // This is kept for non-React contexts only
  console.warn('getContractAbstraction() cannot use hooks. Use useContractFactory() hook in React components instead.');
  return null;
}

