'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { MinecoreState } from '@/lib/game/minecore';
import { MINING_RUN_OPTIONS } from '@/lib/game/diamond-veins-config';
import { MINECORE_MACHINES } from '@/lib/game/minecore/config';
import { computePlantExpectedDiamonds } from '@/lib/game/minecore/compute';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import type { MinecoreMachineId } from '@/lib/game/minecore/types';

const MACHINE_IDS = Object.keys(MINECORE_MACHINES) as MinecoreMachineId[];

const veinIconClass: Record<string, string> = {
  'pulse-drill': 'text-sky-400',
  'crystal-extractor': 'text-violet-400',
  'deep-vein-rig': 'text-emerald-400',
  'quantum-fracturer': 'text-amber-400',
};

export function MinecoreMiningSections(props: { state: MinecoreState }) {
  const { state } = props;
  const [miningRun, setMiningRun] = useState<{ endTime: number; multiplier: number; label: string } | null>(null);

  useEffect(() => {
    if (!miningRun) return;
    const t = setInterval(() => {
      if (Date.now() >= miningRun.endTime) setMiningRun(null);
    }, 1000);
    return () => clearInterval(t);
  }, [miningRun]);

  const byMachine = useMemo(() => {
    const map = new Map<MinecoreMachineId, { count: number; expectedSum: number }>();
    for (const id of MACHINE_IDS) {
      map.set(id, { count: 0, expectedSum: 0 });
    }
    for (const slot of state.plantSlots) {
      if (!slot.unlocked || !slot.setup.machineId) continue;
      const id = slot.setup.machineId;
      const cur = map.get(id) ?? { count: 0, expectedSum: 0 };
      cur.count += 1;
      cur.expectedSum += computePlantExpectedDiamonds(state, slot);
      map.set(id, cur);
    }
    return map;
  }, [state]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Vein breakdown (by type)
          <GameTooltip content="Minecore maps output by installed machine tier. Values show configured yield per cycle for each tier in use.">
            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
              ?
            </button>
          </GameTooltip>
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {MACHINE_IDS.map((k) => {
            const row = byMachine.get(k) ?? { count: 0, expectedSum: 0 };
            const cfg = MINECORE_MACHINES[k];
            return (
              <div key={k} className="flex justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800">
                <span className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <DiamondIcon className={`h-4 w-4 ${veinIconClass[k] ?? 'text-zinc-400'}`} />
                  {cfg.label}
                </span>
                <span className="text-right font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {row.count > 0 ? (
                    <>
                      {row.count} plant{row.count === 1 ? '' : 's'} · {row.expectedSum.toLocaleString()} / cycle
                    </>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Mining run</h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Lock duration for a yield multiplier (same options as Diamond Veins). V1 display: multiplier is shown for your session; plant math will converge with server rules later.
        </p>
        {miningRun ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              Active: {miningRun.label} · {miningRun.multiplier}x yield
            </span>
            <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
              {Math.max(0, Math.ceil((miningRun.endTime - Date.now()) / 60000))} min left
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {MINING_RUN_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() =>
                  setMiningRun({
                    label: opt.label,
                    multiplier: opt.mult,
                    endTime: Date.now() + opt.durationMs,
                  })
                }
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/30 dark:text-emerald-400"
              >
                {opt.label} ({opt.mult}x)
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Options from config:{' '}
          <Link href="/rewards-and-points" className="text-emerald-600 underline dark:text-emerald-400">
            GRID rewards
          </Link>{' '}
          accrue on refine checkpoints, not every second.
        </p>
      </div>
    </div>
  );
}
