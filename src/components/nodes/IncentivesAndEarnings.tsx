'use client';

import type { Incentives } from '@/lib/nodes/types';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

interface IncentivesAndEarningsProps {
  incentives: Incentives;
}

export function IncentivesAndEarnings({ incentives }: IncentivesAndEarningsProps) {
  return (
    <section id="incentives-earnings" className="mb-6">
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
            Earnings & incentives
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              GRID earned
            </p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {incentives.gridEarned}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              XP earned
            </p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {incentives.xpEarned}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
              Current multiplier
            </p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {incentives.currentMultiplier}x
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Fee reduction
            </p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {incentives.feeReductionPercent}%
            </p>
          </div>
        </div>
        {incentives.krexTier && (
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700">
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              KREX tier
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {incentives.krexTier}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
