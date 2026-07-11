'use client';

import Link from 'next/link';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { KREX_TIERS } from '@/lib/rewards/types';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function CrowdKasDashboardHubPointsPanel({ className = '' }: { className?: string }) {
  const { address: kasAddr, totalRedeemable } = useRedeemablePointsBreakdown();
  const { tier: krexTier } = useKREXBalance();
  const tierConfig = KREX_TIERS[krexTier];

  return (
    <aside
      className={`w-full rounded-xl border border-emerald-500/25 bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-zinc-900 dark:via-emerald-950/25 dark:to-zinc-900 p-3.5 shadow-lg ${className}`.trim()}
      aria-label="Hub Points and multiplier summary"
    >
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 mb-1">
        Hub rewards
      </p>
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-3">
        Hub Points & Multiplier
      </h2>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-600 dark:text-zinc-400">Total redeemable</span>
          <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {kasAddr ? formatLargeNumber(totalRedeemable) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-600 dark:text-zinc-400">Points multiplier</span>
          <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {tierConfig.pointsMultiplier}x
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-600 dark:text-zinc-400">Reward multiplier</span>
          <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {tierConfig.multiplier > 0 ? `${tierConfig.multiplier}x` : '—'}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/60 px-2.5 py-2 text-xs text-zinc-700 dark:text-zinc-300 leading-snug">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">CrowdKAS Hub Points</p>
        <ul className="space-y-0.5">
          <li>Create campaign: +{HUB_EARN_POINTS.crowdkasCampaignCreate} pts</li>
        </ul>
      </div>

      {!kasAddr ? (
        <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
          Connect your Kaspa L1 wallet to track redeemable Hub Points on this device.
        </p>
      ) : null}

      <Link
        href="/rewards"
        className="mt-2.5 block w-full text-center k-control-btn !py-2 !text-sm !border-emerald-500/30"
      >
        Open Rewards
      </Link>
    </aside>
  );
}
