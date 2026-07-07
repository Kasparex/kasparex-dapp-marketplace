'use client';

import dynamic from 'next/dynamic';
import { useDAppWidgetActionRail, hasDAppWidgetRailContent } from '@/lib/dapps/DAppWidgetActionRailContext';
import type { DApp } from '@/lib/dapps';

const DAppCalculationBreakdownPanel = dynamic(
  () =>
    import('@/components/dapps/panels/DAppCalculationBreakdownPanel').then(
      (m) => m.DAppCalculationBreakdownPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40" />
    ),
  },
);

/** Sticky action rail beside the widget: fee breakdown, discounts, and dApp action buttons. */
export function DAppWidgetActionPanel({ dapp }: { dapp: DApp }) {
  const { slots } = useDAppWidgetActionRail();
  const hasSlots = hasDAppWidgetRailContent(slots);

  return (
    <DAppCalculationBreakdownPanel
      dapp={dapp}
      showWhenEmpty={hasSlots}
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
