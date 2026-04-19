'use client';

import Link from 'next/link';
import type { TyconGameState, YieldStats } from '@/lib/game/engine';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

export function OverviewPanel({
  tycon,
  stats,
  miningAllowed,
}: {
  tycon: TyconGameState;
  stats: YieldStats;
  miningAllowed: boolean;
}) {
  const foreman = tycon.slots.find((s) => s.type === 'foreman');
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Flow rate
            <GameTooltip content="Diamonds per second from workers, operators, machines, boosts, and power headroom. Tooltip values match the Mining tab.">
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
            <GameTooltip content="Used MW vs cap. If demand exceeds cap, efficiency drops (brownout). Buy power upgrades in the Power tab.">
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
            <GameTooltip content="Foreman NFT enables higher auto-restart caps. Toggle auto-restart in Workers when a Foreman is assigned. Server applies auto-restarts when you sync.">
              <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                ?
              </button>
            </GameTooltip>
          </div>
          <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {tycon.automation.autoRestartMiningRun ? 'Auto-restart on' : 'Auto-restart off'}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Foreman: {foreman?.nftId != null ? `#${foreman.nftId}` : '—'} · cap/day {Math.max(tycon.automation.foremanActive ? 3 : 0, tycon.automation.autoRestartRunsCapPerDay)}
          </p>
        </div>
      </div>
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
