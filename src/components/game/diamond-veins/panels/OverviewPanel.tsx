'use client';

import Link from 'next/link';
import type { TyconGameState, YieldStats } from '@/lib/game/engine';
import { useGamesMainAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';

export function OverviewPanel({
  tycon,
  stats,
  miningAllowed,
  krexTier = 'Tier0',
  krexYieldBonusPct = 0,
  krexShopDiscountPct = 0,
}: {
  tycon: TyconGameState;
  stats: YieldStats;
  miningAllowed: boolean;
  krexTier?: string;
  krexYieldBonusPct?: number;
  krexShopDiscountPct?: number;
}) {
  const rewardFlowGridClass = useGamesMainAdaptiveGrid({ gapClass: 'gap-4' });
  const active = tycon.slots.filter((s) => s.nftId != null && (s.energy ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-700 dark:text-zinc-300">
        <strong className="text-emerald-700 dark:text-emerald-400">Next steps:</strong>{' '}
        {miningAllowed ? (
          <>
            Deploy an NFT on your free starter Worker slot ({active} mining at {stats.yieldPerSecond.toFixed(2)} D/s), buy
            more slots to scale, refine Diamonds, then claim on{' '}
            <Link href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
              Rewards & Hub Points
            </Link>
            .
          </>
        ) : (
          <>Reconnect your wallet to resume idle mining.</>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500">KREX tier bonuses</h3>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          Holding KREX sets your tier to <strong>{krexTier}</strong>
          {krexYieldBonusPct > 0 ? (
            <>
              {' '}
              (+{krexYieldBonusPct}% mining yield)
            </>
          ) : null}
          {krexShopDiscountPct > 0 ? (
            <>
              {' '}
              and {krexShopDiscountPct}% off Shop / slot KAS prices
            </>
          ) : (
            <>
              . Hold more KREX to unlock yield and shop discounts
            </>
          )}
          .
        </p>
      </div>

      <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">How rewards work</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Diamond Veins is an idle miner: assign Workers, Operators, or Foremen to NFT slots (first Worker free), keep them
          fed, refine Diamonds into Hub redeem points.
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
