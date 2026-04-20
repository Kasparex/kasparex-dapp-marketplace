'use client';

import type { Incentives } from '@/lib/nodes/types';
import { FieldHint } from '@/components/ui/FieldHint';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

interface IncentivesAndEarningsProps {
  incentives: Incentives;
}

export function IncentivesAndEarnings({ incentives }: IncentivesAndEarningsProps) {
  return (
    <section id="incentives-earnings" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader title="Earnings & incentives" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              GRID earned
              <FieldHint text="Operator accounting is not enabled yet, so this is 0 for now. Later this will show GRID earned by running nodes." />
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {incentives.gridEarned}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              XP earned
              <FieldHint text="Operator XP incentives are not enabled yet. This will become real when node rewards are turned on." />
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {incentives.xpEarned}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Current multiplier
              <FieldHint text="Current multiplier is derived from your connected node type (Mirror: 5x, Light: 4x). This will become per-operator once accounting is enabled." />
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {incentives.currentMultiplier}x
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Fee reduction
              <FieldHint text="Fee reduction is derived from node type (Mirror: 0.2%, Light: 0.1%). This will become real once fee routing is turned on." />
            </p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {incentives.feeReductionPercent}%
            </p>
          </div>
        </div>
        {incentives.krexTier && (
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1">
              KREX tier
            </p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {incentives.krexTier}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
