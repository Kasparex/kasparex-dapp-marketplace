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
      ? 'Wallet-bound Hub Points on the Kasparex server. Redeem items from the Rewards catalog anytime. Balance is cached and refreshes slowly to keep infra light.'
      : 'Connect your enrolled Kaspa wallet to load server Hub Points.';

  const Outer: React.ElementType = embedded ? 'div' : 'section';
  const outerProps = embedded
    ? { id: 'incentives-earnings', className: 'w-full' }
    : { id: 'incentives-earnings', className: 'mb-6' };

  return (
    <Outer {...outerProps}>
      <div className={CARD_CLASS}>
        <SectionHeader title="Earnings & incentives" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          Run your node, earn <span className="font-semibold">Hub Points</span> on your wallet, redeem later on{' '}
          <span className="font-semibold">Rewards</span>. Higher <span className="font-semibold">KREX tier</span> boosts
          points across the Hub.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
              Hub Points
              <FieldHint text={hubHint} />
            </p>
            <p className="text-2xl font-black text-[#02abb8] dark:text-cyan-300 tracking-tight">
              {formatPts(incentives.hubPoints)}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              +1,000 on enroll · +250 base per qualified online day (× KREX tier, server cron)
            </p>
          </div>
          {incentives.krexTier ? (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 inline-flex items-center gap-1.5">
                KREX tier
                <FieldHint text="Your KREX holding tier on the Hub (fee discounts and Hub Points multipliers on other actions)." />
              </p>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {incentives.krexTier}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Outer>
  );
}
