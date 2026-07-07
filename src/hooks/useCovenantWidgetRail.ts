'use client';

import { useMemo, type DependencyList, type ReactNode } from 'react';
import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { covenantDeployToHubQuote } from '@/lib/payments/hubQuote';
import { useSyncHubQuote } from '@/lib/dapps/PaymentAmountContext';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';

export function useCovenantWidgetRail(
  pricing: KpxCovenantDeployPrice,
  krexBalance: number,
  options: {
    lockAmountKas?: number;
    primaryAction: ReactNode;
    enabled?: boolean;
    deps?: DependencyList;
  },
) {
  const enabled = options.enabled ?? true;
  const hubQuote = useMemo(
    () => (enabled ? covenantDeployToHubQuote(pricing, krexBalance, options.lockAmountKas) : null),
    [enabled, pricing, krexBalance, options.lockAmountKas],
  );

  useSyncHubQuote(hubQuote, options.deps ?? [hubQuote, enabled]);
  useRegisterDAppWidgetRailSlot('actions', enabled ? options.primaryAction : null, options.deps ?? [options.primaryAction, enabled]);
}
