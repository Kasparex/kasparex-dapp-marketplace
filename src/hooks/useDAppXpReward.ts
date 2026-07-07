'use client';

import { useMemo } from 'react';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';

/** Base Hub Points for the dApp's primary action (cards, headers, listings). */
export function useDAppXpReward(dapp: DApp) {
  const networkType = getDAppNetworkType(dapp);

  return useMemo(() => {
    const paymentConfig = getDAppPaymentConfig(dapp, networkType);
    const actionId = paymentConfig?.actions?.[0]?.actionId ?? 'use-dapp';
    return getHubPointsBaseForAction(dapp, actionId);
  }, [dapp, networkType]);
}
