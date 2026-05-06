'use client';

import type { Incentives } from '@/lib/nodes/types';
import { FieldHint } from '@/components/ui/FieldHint';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

interface IncentivesAndEarningsProps {
  incentives: Incentives;
  embedded?: boolean;
}

export function IncentivesAndEarnings({ incentives, embedded }: IncentivesAndEarningsProps) {
  const gridHint =
    incentives.gridEarned > 0
      ? 'Sum of final GRID accrual for today (UTC date) across nodes bound to your connected wallet, from the Kasparex Worker API.'
      : 'Connect the wallet that owns your enrolled nodes. When the Worker has epoch data, today’s GRID accrual appears here.';
  const Outer: any = embedded ? 'div' : 'section';
  const outerProps = embedded
    ? { id: 'incentives-earnings', className: 'w-full' }
    : { id: 'incentives-earnings', className: 'mb-6' };

  return (
    <Outer {...outerProps}>
      <div className={CARD_CLASS}>
        <SectionHeader title="Earnings & incentives" />
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              GRID earned
              <FieldHint text={gridHint} />
            </p>
            <p className="text-2xl font-black text-[#02abb8] dark:text-cyan-300 tracking-tight">
              {incentives.gridEarned}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              L2 pts earned
              <FieldHint text="Operator L2 pts incentives are not enabled yet. This will become real when node rewards are turned on." />
            </p>
            <p className="text-2xl font-black text-[#02abb8] dark:text-cyan-300 tracking-tight">
              {incentives.xpEarned}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Current multiplier
              <FieldHint text="Multiplier follows the enrolled node role (Light / Mirror / Super) from the same tier config as the Worker reward engine." />
            </p>
            <p className="text-2xl font-black text-[#02abb8] dark:text-cyan-300 tracking-tight">
              {incentives.currentMultiplier}x
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Fee reduction
              <FieldHint text="Fee reduction percentages are defined per role in the Worker tier config; on-chain fee routing is optional follow-up work." />
            </p>
            <p className="text-2xl font-black text-[#02abb8] dark:text-cyan-300 tracking-tight">
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
    </Outer>
  );
}
