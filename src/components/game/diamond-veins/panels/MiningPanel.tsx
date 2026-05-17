'use client';

import Link from 'next/link';
import type { YieldStats } from '@/lib/game/engine';
import type { TyconGameState } from '@/lib/game/engine';
import { DIAMOND_COMMODITY_KEYS, type DiamondCommodity } from '@/lib/game/engine';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { useGamesMainAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';
import { useState } from 'react';

const DIAMOND_LABELS: Record<DiamondCommodity, string> = {
  chronoShard: 'Chrono Shard (CSD)',
  auroraCore: 'Aurora Core (ACD)',
  cipherPrism: 'Cipher Prism (CPD)',
  eonCore: 'Eon Core (ECD)',
  eclipticFlame: 'Ecliptic Flame (EFD)',
  rubble: 'Rubble',
};

export function MiningPanel({
  tycon,
  stats,
  diamonds,
  refineMinDiamonds,
  refining,
  onRefine,
  miningRun,
  miningRunOptions,
  onStartMiningRun,
}: {
  tycon: TyconGameState;
  stats: YieldStats;
  diamonds: number;
  refineMinDiamonds: number;
  refining: boolean;
  onRefine: () => void | Promise<void>;
  miningRun: { endTime: number; multiplier: number; option: { label: string } | null } | null;
  miningRunOptions: readonly { label: string; durationMs: number; mult: number }[];
  onStartMiningRun: (i: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const veinIconClass: Record<DiamondCommodity, string> = {
    chronoShard: 'text-sky-400',
    auroraCore: 'text-violet-400',
    cipherPrism: 'text-emerald-400',
    eonCore: 'text-amber-400',
    eclipticFlame: 'text-rose-400',
    rubble: 'text-zinc-400',
  };

  const foreman = tycon.slots.find((s) => s.type === 'foreman');
  const cardGridClass = useGamesMainAdaptiveGrid();
  const veinGridClass = useGamesMainAdaptiveGrid({ gapClass: 'gap-2' });

  return (
    <div className="space-y-8">
      <CardsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={['Operational', 'Idle', 'Critical']}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className={cardGridClass}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Flow rate
            <GameTooltip
              title="Flow rate"
              description="Diamonds per second from workers, operators, machines, boosts, and available power headroom."
            >
              <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                ?
              </button>
            </GameTooltip>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{stats.yieldPerSecond.toFixed(2)} D/s</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Power
            <GameTooltip
              title="Power"
              description="Used MW versus site cap. Oversubscribing the cap reduces efficiency (brownout) - upgrade power in the Power tab."
            >
              <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                ?
              </button>
            </GameTooltip>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
            {stats.powerUsedMw.toFixed(1)} / {stats.powerCapMw} MW
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Efficiency {(stats.powerEfficiency * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Automation
            <GameTooltip
              title="Automation"
              description="A Foreman NFT unlocks higher auto-restart caps; toggle auto-restart on the Workers tab. The server applies restarts when you sync."
            >
              <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                ?
              </button>
            </GameTooltip>
          </div>
          <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {tycon.automation.autoRestartMiningRun ? 'Auto-restart on' : 'Auto-restart off'}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Foreman: {foreman?.nftId != null ? `#${foreman.nftId}` : '-'} · cap/day {Math.max(tycon.automation.foremanActive ? 3 : 0, tycon.automation.autoRestartRunsCapPerDay)}
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="absolute -right-32 -top-32 h-64 w-64 bg-emerald-500/10 blur-[80px]" />
        <div className="relative flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-500">Mining</span>
            <div className="flex items-baseline gap-3">
              <GameTooltip
                title="Diamond balance"
                description="Total in-game diamonds across five vein types that accrue in the background - see the breakdown below."
              >
                <h2 className="cursor-help text-5xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100 lg:text-6xl">
                  {Math.floor(diamonds).toLocaleString()}
                </h2>
              </GameTooltip>
              <span className="inline-flex items-center gap-2 font-medium text-zinc-500 dark:text-zinc-400">
                <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />
                DIAMONDS
              </span>
            </div>
            <p className="max-w-md text-base text-zinc-600 dark:text-zinc-400">
              Refine at <strong>{refineMinDiamonds}+</strong> for refinement points and GRID checkpoint entries.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onRefine()}
            disabled={diamonds < refineMinDiamonds || refining}
            className="k-cta-games group relative h-16 px-8 text-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {refining ? '…' : 'REFINE NOW'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Vein breakdown (by type)
          <GameTooltip
            title="Vein mix"
            description="Weights shift with Worker and Operator traits. Rubble fills pacing when no vein has a strong affinity."
          >
            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
              ?
            </button>
          </GameTooltip>
        </h3>
        <div className={veinGridClass}>
          {DIAMOND_COMMODITY_KEYS.map((k) => (
            <div key={k} className="flex justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800">
              <span className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <DiamondIcon className={`h-4 w-4 ${veinIconClass[k]}`} />
                {DIAMOND_LABELS[k]}
              </span>
              <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {tycon.diamondInventory[k].toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-zinc-100 p-6 text-sm dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="flex flex-wrap gap-8">
          <div>
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Flow rate</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-500">{stats.yieldPerSecond.toFixed(2)} D/s</p>
          </div>
          <div>
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Operator mult</span>
            <p className="font-bold text-zinc-700 dark:text-zinc-300">{(stats.totalMultiplier * 100).toFixed(0)}%</p>
          </div>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">Kasparex · Kaspa BlockDAG</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Mining run</h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Lock duration for a yield multiplier. Auto-restart (Workers tab) reapplies when the Foreman policy allows.</p>
        {miningRun ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              Active: {miningRun.option?.label ?? 'Run'} · {miningRun.multiplier}x yield
            </span>
            <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
              {Math.ceil((miningRun.endTime - Date.now()) / 60000)} min left
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {miningRunOptions.map((opt, i) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => onStartMiningRun(i)}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/30 dark:text-emerald-400"
              >
                {opt.label} ({opt.mult}x)
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Options from config: <Link href="/rewards" className="text-emerald-600 underline dark:text-emerald-400">GRID rewards</Link> accrue on refine checkpoints, not every second.
        </p>
      </div>
    </div>
  );
}
