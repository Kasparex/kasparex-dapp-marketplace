'use client';

import type { Incentives } from '@/lib/nodes/types';

const CARD_CLASS =
  'bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6';

interface IncentivesAndEarningsProps {
  incentives: Incentives;
}

export function IncentivesAndEarnings({ incentives }: IncentivesAndEarningsProps) {
  return (
    <section id="incentives-earnings" className="mb-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Incentives & Earnings
      </h2>
      <div className={`${CARD_CLASS} grid sm:grid-cols-2 lg:grid-cols-4 gap-4`}>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-1">
            GRID earned
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {incentives.gridEarned}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-1">
            XP earned
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {incentives.xpEarned}
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-1">
            Current multiplier
          </p>
          <p className="text-lg font-semibold text-[#02abb8]">
            {incentives.currentMultiplier}x
          </p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-1">
            Fee reduction
          </p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {incentives.feeReductionPercent}%
          </p>
        </div>
      </div>
      {incentives.krexTier && (
        <div className="mt-4 p-4 bg-[#02abb8]/10 dark:bg-[#02abb8]/20 rounded-lg border border-[#02abb8]/30">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            KREX tier: <span className="font-medium text-zinc-900 dark:text-zinc-100">{incentives.krexTier}</span>
          </p>
        </div>
      )}
    </section>
  );
}
