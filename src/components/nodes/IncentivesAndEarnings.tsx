'use client';

import type { Incentives } from '@/lib/nodes/types';

const CARD_CLASS =
  'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[32px] overflow-hidden shadow-sm p-6';

interface IncentivesAndEarningsProps {
  incentives: Incentives;
}

export function IncentivesAndEarnings({ incentives }: IncentivesAndEarningsProps) {
  return (
    <section id="incentives-earnings" className="mb-6">
      <div className={CARD_CLASS}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-6 bg-[#02abb8] rounded-full" />
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
          <div className="p-4 rounded-xl bg-[#02abb8]/10 dark:bg-[#02abb8]/20 border border-[#02abb8]/30">
            <p className="text-[10px] font-bold text-[#02abb8] uppercase tracking-wider mb-1">
              Current multiplier
            </p>
            <p className="text-xl font-black text-[#02abb8] tracking-tight">
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
