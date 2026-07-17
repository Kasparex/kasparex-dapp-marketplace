'use client';

import { useDAppWidgetActionRail, hasDAppWidgetRailContent } from '@/lib/dapps/DAppWidgetActionRailContext';
import { DAppCalculationBreakdownPanel } from '@/components/dapps/panels/DAppCalculationBreakdownPanel';
import type { DApp } from '@/lib/dapps';

/** Sticky action rail beside the widget: fee breakdown, discounts, and dApp action buttons. */
export function DAppWidgetActionPanel({ dapp }: { dapp: DApp }) {
  const { slots } = useDAppWidgetActionRail();
  const hasSlots = hasDAppWidgetRailContent(slots);

  return (
    <DAppCalculationBreakdownPanel
      dapp={dapp}
      showWhenEmpty={hasSlots}
      flowProgressSlot={slots.flowProgress}
      footer={
        <>
          {slots.extraBreakdown}
          {slots.actions}
          {slots.alerts}
        </>
      }
    />
  );
}
