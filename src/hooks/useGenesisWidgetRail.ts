'use client';

import { useMemo, type DependencyList, type ReactNode } from 'react';
import type { GenesisMessageQuote } from '@/lib/genesis/pricing';
import { genesisMessageToHubQuote } from '@/lib/payments/hubQuote';
import type { KREXTier } from '@/lib/rewards/types';
import { useSyncHubQuote } from '@/lib/dapps/PaymentAmountContext';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';

export function useGenesisWidgetRail(
  quote: GenesisMessageQuote | null,
  krexBalance: number,
  krexTier: KREXTier,
  options: {
    primaryAction: ReactNode;
    enabled?: boolean;
    deps?: DependencyList;
  },
) {
  const enabled = options.enabled ?? true;
  const hubQuote = useMemo(
    () => (enabled && quote ? genesisMessageToHubQuote(quote, krexBalance, krexTier) : null),
    [enabled, quote, krexBalance, krexTier],
  );

  useSyncHubQuote(hubQuote, options.deps ?? [hubQuote, enabled]);
  useRegisterDAppWidgetRailSlot('actions', enabled ? options.primaryAction : null, options.deps ?? [options.primaryAction, enabled]);
}
