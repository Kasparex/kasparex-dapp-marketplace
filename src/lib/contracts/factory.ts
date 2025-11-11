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
 */
export function useContractFactory(): {
  abstraction: ContractAbstraction;
  networkType: 'evm' | 'vprogs';
  chainId: number;
} {
  const chainId = useChainId();
  const isVProgs = isVProgsNetwork(chainId);

  if (isVProgs) {
    const vprogs = useVProgsContracts();
    return {
      abstraction: vprogs.abstraction,
      networkType: 'vprogs',
      chainId,
    };
  } else {
    const evm = useEVMContracts();
    return {
      abstraction: evm.abstraction,
      networkType: 'evm',
      chainId,
    };
  }
}

/**
 * Get contract abstraction for a specific network
 */
export function getContractAbstraction(chainId: number): ContractAbstraction {
  if (isVProgsNetwork(chainId)) {
    const { useVProgsContracts } = require('./vprogs');
    const vprogs = useVProgsContracts();
    return vprogs.abstraction;
  } else {
    const { useEVMContracts } = require('./evm');
    const evm = useEVMContracts();
    return evm.abstraction;
  }
}

