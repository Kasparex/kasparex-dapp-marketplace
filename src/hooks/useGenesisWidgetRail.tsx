'use client';

import { useMemo, type DependencyList, type ReactNode } from 'react';
import type { GenesisMessageQuote } from '@/lib/genesis/pricing';
import { genesisMessageToHubQuote } from '@/lib/payments/hubQuote';
import type { KREXTier } from '@/lib/rewards/types';
import { useSyncHubQuote } from '@/lib/dapps/PaymentAmountContext';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';

export function useGenesisWidgetRail(
  quote: GenesisMessageQuote | null,
  krexBalance: number,
  krexTier: KREXTier,
  options: {
    primaryAction: ReactNode;
    enabled?: boolean;
    deps?: DependencyList;
    flowBusy?: boolean;
    flowComplete?: boolean;
  },
) {
  const enabled = options.enabled ?? true;
  const hubQuote = useMemo(
    () => (enabled && quote ? genesisMessageToHubQuote(quote, krexBalance, krexTier) : null),
    [enabled, quote, krexBalance, krexTier],
  );

  const flowProgress = useMemo(
    () => (
      <HubFlowProgress
        steps={getHubFlowPreset('hubPay')}
        busy={options.flowBusy}
        complete={options.flowComplete}
      />
    ),
    [options.flowBusy, options.flowComplete],
  );

  useSyncHubQuote(hubQuote, options.deps ?? [hubQuote, enabled]);
  useRegisterDAppWidgetRailSlot(
    'actions',
    enabled ? options.primaryAction : null,
    options.deps ?? [options.primaryAction, enabled],
  );
  useRegisterDAppWidgetRailSlot('flowProgress', enabled ? flowProgress : null, [
    flowProgress,
    enabled,
  ]);
}
