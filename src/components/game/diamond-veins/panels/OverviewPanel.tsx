'use client';

import Link from 'next/link';
import type { TyconGameState, YieldStats } from '@/lib/game/engine';

export function OverviewPanel({
  tycon,
  stats,
  miningAllowed,
}: {
  tycon: TyconGameState;
  stats: YieldStats;
  miningAllowed: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
        <strong className="text-emerald-700 dark:text-emerald-400">Next steps:</strong>{' '}
        {miningAllowed ? (
          <>
            Keep mining, assign Workers in the Workers tab, then <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">claim GRID checkpoints</Link> after refine.
          </>
        ) : (
          <>Reconnect your wallet to resume passive accrual.</>
        )}
      </div>
    </div>
  );
}
