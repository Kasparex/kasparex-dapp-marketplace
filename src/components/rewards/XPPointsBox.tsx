'use client';

import Link from 'next/link';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';

/** Summary of Kaspa-linked hub redeemable pts (replaces legacy EVM-only XP teaser). */
export function XPPointsBox() {
  const { address: kasAddr, totalRedeemable, lines } = useRedeemablePointsBreakdown();

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Hub pts</h3>
      </div>

      {!kasAddr ? (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Connect your Kaspa L1 wallet from the hub header.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
            Redeemable pts live on Rewards and sync with gameplay plus creator actions.
          </p>
          <Link
            href="/rewards#rewards-points"
            className="inline-block px-3 py-1.5 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            How to earn pts
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">Total redeemable</span>
            <span className="text-xl font-bold text-[#02abb8] tabular-nums">{formatLargeNumber(totalRedeemable)}</span>
          </div>
          {lines.length > 0 && (
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
              {lines.map((l) => (
                <div key={l.id} className="flex justify-between gap-2">
                  <span>{l.label}</span>
                  <span className="tabular-nums">{l.points.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/rewards"
            className="block w-full mt-2 px-3 py-2 text-xs font-medium text-center bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            Open Rewards
          </Link>
        </div>
      )}
    </div>
  );
}
