'use client';

import type { TyconGameState, YieldStats } from '@/lib/game/engine';
import { useGamesMainAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';

export function OverviewPanel({ tycon: _tycon, stats: _stats }: { tycon: TyconGameState; stats: YieldStats }) {
  const rewardFlowGridClass = useGamesMainAdaptiveGrid({ gapClass: 'gap-4' });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">How rewards work</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Diamond Veins is an idle miner: assign Workers, Operators, or Foremen to NFT slots (first Worker free), keep them
          fed, refine Diamonds into Hub redeem points from the Game Deck.
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
            <p className="text-xs text-zinc-500">Restore energy with Shop consumables, then refine Diamonds into Hub points.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 text-xs font-bold uppercase text-zinc-400">Step 3</div>
            <div className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">Hub Rewards</div>
            <p className="text-xs text-zinc-500">Spend Hub points on the Rewards catalog (same bridge as Minecore).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
