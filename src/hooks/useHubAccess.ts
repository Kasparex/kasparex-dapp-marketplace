'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  evaluateHubAccess,
  getHubGateMessage,
  type HubAccessRequirement,
  type HubAccessResult,
  type HubGateReason,
} from '@/lib/hub/access';

export function useHubAccess(requirement: HubAccessRequirement): HubAccessResult & {
  gateReason: HubGateReason;
  message: string;
} {
  const chainId = useChainId();
  const { isConnected: isEvmConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();

  return useMemo(() => {
    const access = evaluateHubAccess({
      requirement,
      isKaspaConnected: kaspaState.isConnected,
      isEvmConnected,
      chainId,
    });

    return {
      ...access,
      gateReason: access.reason,
      message: getHubGateMessage(access.reason, access.requiredChainNames),
    };
  }, [requirement, kaspaState.isConnected, isEvmConnected, chainId]);
}
