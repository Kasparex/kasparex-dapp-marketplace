'use client';

import Link from 'next/link';
import type { TyconGameState, YieldStats } from '@/lib/game/engine';
import { useGamesMainAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';

export function OverviewPanel({
  tycon,
  stats,
  miningAllowed,
}: {
  tycon: TyconGameState;
  stats: YieldStats;
  miningAllowed: boolean;
}) {
  const rewardFlowGridClass = useGamesMainAdaptiveGrid({ gapClass: 'gap-4' });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
        <strong className="text-emerald-700 dark:text-emerald-400">Next steps:</strong>{' '}
        {miningAllowed ? (
          <>
            Keep mining, assign Workers in the Workers tab, then <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">claim GRID checkpoints</Link> after refine.
          </>
        ) : (
          <>Reconnect your wallet to resume passive accrual.</>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">How the reward system works</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Diamond Veins uses a structured reward flow designed for zero-gas accrual and bulk claiming:
        </p>
        <div className={rewardFlowGridClass}>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Step 1</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Mine & Refine</div>
            <p className="text-xs text-zinc-500">Extract raw Diamonds and convert them to Refinement Points for free (L1).</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Step 2</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Reward Weight</div>
            <p className="text-xs text-zinc-500">Accumulate your Weight to grow your Kasparex Rank and ecosystem benefits.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs font-bold text-zinc-400 uppercase mb-2">Step 3</div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">L2 Claim</div>
            <p className="text-xs text-zinc-500">Claim your Points as real GRID or KREX tokens on the L2 network whenever you want.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
