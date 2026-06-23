'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  evaluateDAppAccess,
  getDAppGateMessage,
  type DAppAccessResult,
  type DAppGateReason,
} from '@/lib/dapps/access';

export interface UseDAppAccessOptions {
  dapp: DApp;
  selectedNetwork?: 'all' | 'L1' | 'L2';
  isContractMissingOnNetwork?: boolean;
}

export interface UseDAppAccessResult extends DAppAccessResult {
  message: string;
  gateReason: DAppGateReason;
}

export function useDAppAccess({
  dapp,
  selectedNetwork = 'all',
  isContractMissingOnNetwork = false,
}: UseDAppAccessOptions): UseDAppAccessResult {
  const chainId = useChainId();
  const { isConnected: isEvmConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();

  return useMemo(() => {
    const access = evaluateDAppAccess({
      dapp,
      selectedNetwork,
      isKaspaConnected: kaspaState.isConnected,
      isEvmConnected,
      chainId,
      isContractMissingOnNetwork,
    });

    return {
      ...access,
      gateReason: access.reason,
      message: getDAppGateMessage(access.reason, access.requiredChainNames),
    };
  }, [
    dapp,
    selectedNetwork,
    kaspaState.isConnected,
    isEvmConnected,
    chainId,
    isContractMissingOnNetwork,
  ]);
}
