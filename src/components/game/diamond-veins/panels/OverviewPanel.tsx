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
  const active = tycon.slots.filter((s) => s.nftId != null && (s.energy ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
        <strong className="text-emerald-700 dark:text-emerald-400">Next steps:</strong>{' '}
        {miningAllowed ? (
          <>
            Deploy NFTs on the Mining tab ({active} mining now at {stats.yieldPerSecond.toFixed(2)} D/s), refine Diamonds into
            redeem points, then claim on{' '}
            <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
              Rewards & Hub Points
            </Link>
            .
          </>
        ) : (
          <>Reconnect your wallet to resume idle mining.</>
        )}
      </div>

      <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">How rewards work</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Diamond Veins is an idle miner: assign Workers, Operators, or Foremen to paid NFT slots, keep them fed, refine
          Diamonds into Hub redeem points.
        </p>
        <div className={rewardFlowGridClass}>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 text-xs font-bold uppercase text-zinc-400">Step 1</div>
            <div className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">Slot & Mine</div>
            <p className="text-xs text-zinc-500">Place an NFT in a slot. Higher tiers mine faster and last longer.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 text-xs font-bold uppercase text-zinc-400">Step 2</div>
            <div className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">Feed & Refine</div>
            <p className="text-xs text-zinc-500">Restore energy with Shop consumables, then refine Diamonds into points.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 text-xs font-bold uppercase text-zinc-400">Step 3</div>
            <div className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">Hub Rewards</div>
            <p className="text-xs text-zinc-500">Redeem points toward Hub catalog rewards (same bridge as Minecore).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
