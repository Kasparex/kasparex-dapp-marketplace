'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { DApp } from '@/lib/dapps';
import { getDAppNetworkType } from '@/lib/dapps';

export interface NetworkAwareWalletResult {
  networkType: 'L1' | 'L2';
  isL1WalletConnected: boolean;
  isL2WalletConnected: boolean;
  isCorrectWalletConnected: boolean;
  shouldShowL1Wallet: boolean;
  shouldShowL2Wallet: boolean;
  kaspaAddress: string | null;
  evmAddress: string | null;
  message: string;
}

/**
 * Hook that determines which wallet type should be prioritized based on dApp network type
 * 
 * @param dapp - The dApp to check network type for
 * @returns NetworkAwareWalletResult with wallet connection state and prioritization info
 */
export function useNetworkAwareWallet(dapp?: DApp): NetworkAwareWalletResult {
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();

  return useMemo(() => {
    // If no dApp provided, return neutral state
    if (!dapp) {
      return {
        networkType: 'L2',
        isL1WalletConnected: kaspaState.isConnected,
        isL2WalletConnected: isEVMConnected,
        isCorrectWalletConnected: false,
        shouldShowL1Wallet: false,
        shouldShowL2Wallet: false,
        kaspaAddress: kaspaState.address,
        evmAddress: evmAddress || null,
        message: 'Please connect a wallet to interact with this dApp.',
      };
    }

    const networkType = getDAppNetworkType(dapp);
    const isL1WalletConnected = kaspaState.isConnected;
    const isL2WalletConnected = isEVMConnected;

    // Determine which wallet should be shown/prioritized
    const shouldShowL1Wallet = networkType === 'L1';
    const shouldShowL2Wallet = networkType === 'L2';

    // Check if the correct wallet type is connected
    const isCorrectWalletConnected = 
      (networkType === 'L1' && isL1WalletConnected) ||
      (networkType === 'L2' && isL2WalletConnected);

    // Generate appropriate message
    let message = '';
    if (!isCorrectWalletConnected) {
      if (networkType === 'L1') {
        message = 'This dApp runs on L1 (Kaspa). Please connect your Kaspa wallet to continue.';
      } else {
        message = 'This dApp runs on L2 (EVM). Please connect your EVM wallet to continue.';
      }
    } else {
      if (networkType === 'L1') {
        message = 'Kaspa wallet connected. Ready to interact with this L1 dApp.';
      } else {
        message = 'EVM wallet connected. Ready to interact with this L2 dApp.';
      }
    }

    return {
      networkType,
      isL1WalletConnected,
      isL2WalletConnected,
      isCorrectWalletConnected,
      shouldShowL1Wallet,
      shouldShowL2Wallet,
      kaspaAddress: kaspaState.address,
      evmAddress: evmAddress || null,
      message,
    };
  }, [dapp, kaspaState.isConnected, kaspaState.address, isEVMConnected, evmAddress]);
}
