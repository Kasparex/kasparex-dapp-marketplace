'use client';

import type { MachineTier, YieldStats } from '@/lib/game/engine';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

export function PowerPanel({
  machines,
  powerCapMw,
  stats,
  onBuyDrill,
  onBuyPower,
}: {
  machines: MachineTier[];
  powerCapMw: number;
  stats: YieldStats;
  onBuyDrill: () => void;
  onBuyPower: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Power budget
          <GameTooltip
            title="Power budget"
            description="Each drill draws MW. If total draw exceeds your cap, mining efficiency scales down — expand the grid to avoid brownouts."
          >
            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
              ?
            </button>
          </GameTooltip>
        </h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Used {stats.powerUsedMw.toFixed(2)} MW of {powerCapMw} MW · efficiency {(stats.powerEfficiency * 100).toFixed(0)}%
        </p>
        <div className="flex flex-wrap gap-2">
          <GameTooltip
            title="Add drill (demo)"
            description="Demo progression: adds another surface drill and increases draw plus yield. Future versions will price upgrades in KAS/KREX with receipt verification."
          >
            <button type="button" onClick={onBuyDrill} className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Add drill (demo)
            </button>
          </GameTooltip>
          <GameTooltip
            title="Expand grid (demo)"
            description="Demo: +4 MW to your site cap. Paid upgrades will post a Kasplex L2 or L1 receipt when wired."
          >
            <button type="button" onClick={onBuyPower} className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
              Expand grid (+4 MW)
            </button>
          </GameTooltip>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Machines</h4>
        <ul className="space-y-2 text-sm">
          {machines.map((m) => (
            <li key={m.id} className="flex justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{m.id}</span>
              <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                ×{m.count} · {m.powerPerUnit} MW/unit
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
