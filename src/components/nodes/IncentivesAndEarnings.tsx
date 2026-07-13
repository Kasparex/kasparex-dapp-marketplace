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

function formatPts(n: number | null | undefined): string {
  if (n == null) return '—';
  return Math.max(0, Math.floor(n)).toLocaleString();
}

export function IncentivesAndEarnings({ incentives, embedded }: IncentivesAndEarningsProps) {
  const hubHint =
    incentives.hubPoints != null
      ? 'Wallet-bound Hub Points on the Kasparex server. Redeem GRID/KREX on the Rewards page. Not stored in browser cookies.'
      : 'Connect your enrolled Kaspa wallet to load server Hub Points.';

  const epochHint =
    incentives.epochScore > 0
      ? 'Internal uptime/activity score for today (UTC). Informational only; not a token balance. Qualified days also credit Hub Points via server cron.'
      : 'Stays at 0 until your node qualifies for the UTC epoch (about 12h uptime in one day).';

  const Outer: React.ElementType = embedded ? 'div' : 'section';
  const outerProps = embedded
    ? { id: 'incentives-earnings', className: 'w-full' }
    : { id: 'incentives-earnings', className: 'mb-6' };

  return (
    <Outer {...outerProps}>
      <div className={CARD_CLASS}>
        <SectionHeader title="Earnings & incentives" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Operator rewards use <span className="font-semibold">server Hub Points</span> (wallet-bound).
          Redeem on <span className="font-semibold">Rewards</span> when you want GRID or KREX from the pool.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Hub Points
              <FieldHint text={hubHint} />
            </p>
            <p className="text-2xl font-black text-[#02abb8] dark:text-cyan-300 tracking-tight">
              {formatPts(incentives.hubPoints)}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Epoch score (today)
              <FieldHint text={epochHint} />
            </p>
            <p className="text-2xl font-black text-zinc-700 dark:text-zinc-300 tracking-tight">
              {incentives.epochScore > 0 ? incentives.epochScore.toLocaleString() : '0'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Role multiplier
              <FieldHint text="Policy multiplier for your enrolled node role (light / mirror / super)." />
            </p>
            <p className="text-2xl font-black text-[#02abb8] dark:text-cyan-300 tracking-tight">
              {incentives.currentMultiplier}x
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Fee reduction (policy)
              <FieldHint text="Planned operator benefit from tier config. Full on-chain fee routing is not live yet." />
            </p>
            <p className="text-2xl font-black text-zinc-500 dark:text-zinc-400 tracking-tight">
              {incentives.feeReductionPercent <= 1
                ? `${(incentives.feeReductionPercent * 100).toFixed(0)}%`
                : `${incentives.feeReductionPercent}%`}
            </p>
          </div>
        </div>
        {incentives.krexTier ? (
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              KREX tier
              <FieldHint text="Your KREX holding tier across the Hub (fee discounts and Hub Points multipliers on other actions)." />
            </p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{incentives.krexTier}</p>
          </div>
        ) : null}
      </div>
    </Outer>
  );
}
