'use client';

import { useMemo, type DependencyList, type ReactNode } from 'react';
import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { covenantDeployToHubQuote } from '@/lib/payments/hubQuote';
import { useSyncHubQuote } from '@/lib/dapps/PaymentAmountContext';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import {
  buildCovenantClaimFlowSteps,
  buildCovenantCreateFlowSteps,
  getHubFlowPreset,
  type HubFlowPresetKey,
  type HubFlowStep,
} from '@/lib/hub/hubFlowProgress';

export function useCovenantWidgetRail(
  pricing: KpxCovenantDeployPrice,
  krexBalance: number,
  options: {
    lockAmountKas?: number;
    primaryAction: ReactNode;
    /** Shown in Calculation Breakdown directly below the primary action. */
    alerts?: ReactNode;
    enabled?: boolean;
    deps?: DependencyList;
    flowBusy?: boolean;
    flowComplete?: boolean;
    flowPreset?: HubFlowPresetKey;
    /** Override built-in preset steps. */
    flowSteps?: HubFlowStep[];
    /** Lock / share signatures before Hub fee (create flows). */
    flowLockSignCount?: number;
    /** When true, omit the Hub fee wallet prompt from the flow. */
    flowFeeWaived?: boolean;
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

  const flowSteps = useMemo(() => {
    if (options.flowSteps) return options.flowSteps;
    if (flowPreset === 'covenantCreate') {
      return buildCovenantCreateFlowSteps({
        lockSignCount: options.flowLockSignCount ?? 1,
        feeWaived: options.flowFeeWaived,
      });
    }
    if (flowPreset === 'covenantClaim') {
      return buildCovenantClaimFlowSteps({
        feeWaived: options.flowFeeWaived,
      });
    }
    return getHubFlowPreset(flowPreset);
  }, [
    options.flowSteps,
    flowPreset,
    options.flowLockSignCount,
    options.flowFeeWaived,
  ]);

  const flowProgress = useMemo(
    () => (
      <HubFlowProgress
        steps={flowSteps}
        busy={options.flowBusy}
        complete={options.flowComplete}
      />
    ),
    [flowSteps, options.flowBusy, options.flowComplete],
  );

  useSyncHubQuote(hubQuote, options.deps ?? [hubQuote, enabled]);
  useRegisterDAppWidgetRailSlot(
    'actions',
    enabled ? options.primaryAction : null,
    options.deps ?? [options.primaryAction, enabled],
  );
  useRegisterDAppWidgetRailSlot(
    'alerts',
    options.alerts ?? null,
    options.deps ?? [options.alerts],
  );
  useRegisterDAppWidgetRailSlot(
    'flowProgress',
    enabled || options.flowAlwaysVisible ? flowProgress : null,
    [flowProgress, enabled, options.flowAlwaysVisible],
  );
}
