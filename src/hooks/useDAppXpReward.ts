'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';

/** Hub pts earned per first action for listing/detail reward badges. */
export function useDAppXpReward(dapp: DApp) {
  const chainId = useChainId();
  const networkType = getDAppNetworkType(dapp);

  return useMemo(() => {
    const config = getDAppPaymentConfig(dapp, networkType);
    const rewards = getDefaultRewardsBreakdown(chainId);
    const baseCost = config?.actions?.[0]?.baseCost ?? 1;
    return Math.round(rewards.xpPerKas * baseCost);
  }, [dapp, networkType, chainId]);
}
