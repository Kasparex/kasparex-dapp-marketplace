'use client';

import { useMemo, type DependencyList, type ReactNode } from 'react';
import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { covenantDeployToHubQuote } from '@/lib/payments/hubQuote';
import { useSyncHubQuote } from '@/lib/dapps/PaymentAmountContext';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset, type HubFlowPresetKey } from '@/lib/hub/hubFlowProgress';

export function useCovenantWidgetRail(
  pricing: KpxCovenantDeployPrice,
  krexBalance: number,
  options: {
    lockAmountKas?: number;
    primaryAction: ReactNode;
    enabled?: boolean;
    deps?: DependencyList;
    flowBusy?: boolean;
    flowComplete?: boolean;
    flowPreset?: HubFlowPresetKey;
    /** When false, keep quote/actions off but still show Flow Progress. */
    flowAlwaysVisible?: boolean;
  },
) {
  const enabled = options.enabled ?? true;
  const flowPreset = options.flowPreset ?? 'covenantCreate';
  const hubQuote = useMemo(
    () => (enabled ? covenantDeployToHubQuote(pricing, krexBalance, options.lockAmountKas) : null),
    [enabled, pricing, krexBalance, options.lockAmountKas],
  );

  const flowProgress = useMemo(
    () => (
      <HubFlowProgress
        steps={getHubFlowPreset(flowPreset)}
        busy={options.flowBusy}
        complete={options.flowComplete}
      />
    ),
    [flowPreset, options.flowBusy, options.flowComplete],
  );

  useSyncHubQuote(hubQuote, options.deps ?? [hubQuote, enabled]);
  useRegisterDAppWidgetRailSlot(
    'actions',
    enabled ? options.primaryAction : null,
    options.deps ?? [options.primaryAction, enabled],
  );
  useRegisterDAppWidgetRailSlot(
    'flowProgress',
    enabled || options.flowAlwaysVisible ? flowProgress : null,
    [flowProgress, enabled, options.flowAlwaysVisible],
  );
}
