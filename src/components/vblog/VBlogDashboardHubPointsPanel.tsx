'use client';

import Link from 'next/link';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { KREX_TIERS } from '@/lib/rewards/types';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function VBlogDashboardHubPointsPanel({ className = '' }: { className?: string }) {
  const { address: kasAddr, totalRedeemable } = useRedeemablePointsBreakdown();
  const { tier: krexTier } = useKREXBalance();
  const tierConfig = KREX_TIERS[krexTier];

  return (
    <aside
      className={`w-full xl:w-[280px] shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-br from-white via-zinc-50 to-[color:var(--hub-accent-muted)] dark:from-zinc-900 dark:via-zinc-900 dark:to-[color:var(--hub-accent-muted)] p-3.5 shadow-lg ${className}`.trim()}
      aria-label="Hub Points and multiplier summary"
    >
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[color:var(--hub-accent)] dark:text-[color:var(--hub-accent-light)] mb-1">
        Hub rewards
      </p>
      <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug mb-3">
        Hub Points & Multiplier
      </h2>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-600 dark:text-zinc-400">Total redeemable</span>
          <span className="font-bold tabular-nums text-[color:var(--hub-accent)]">
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
        <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">vBlog Hub Points</p>
        <ul className="space-y-0.5">
          <li>Publish: +{HUB_EARN_POINTS.vblogArticleCreate} pts</li>
          <li>Update: +{HUB_EARN_POINTS.vblogArticleUpdate} pts</li>
        </ul>
      </div>

      {!kasAddr ? (
        <p className="mt-2.5 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
          Connect your Kaspa L1 wallet to track redeemable Hub Points on this device.
        </p>
      ) : null}

      <Link
        href="/rewards"
        className="mt-2.5 block w-full text-center k-control-btn !py-2 !text-sm"
      >
        Open Rewards
      </Link>
    </aside>
  );
}
