'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { MinecoreState } from '@/lib/game/minecore';
import type { MinecoreComputeContext } from '@/lib/game/minecore/compute-context';
import { MINECORE_MACHINES } from '@/lib/game/minecore/config';
import { computePlantExpectedDiamonds } from '@/lib/game/minecore/compute';
import { computePlantDiamondsPer24h } from '@/lib/game/minecore/plant-economy';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import type { MinecoreMachineId } from '@/lib/game/minecore/types';
import { useGamesMainAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';

const MACHINE_IDS = Object.keys(MINECORE_MACHINES) as MinecoreMachineId[];

const veinIconClass: Record<string, string> = {
  'pulse-drill': 'text-sky-400',
  'crystal-extractor': 'text-violet-400',
  'deep-vein-rig': 'text-emerald-400',
  'quantum-fracturer': 'text-amber-400',
};

/** Vein-style totals grouped by rig type (shown on the Power tab). */
export function MinecoreVeinBreakdownByMachine(props: {
  state: MinecoreState;
  computeCtx?: MinecoreComputeContext;
}) {
  const { state, computeCtx } = props;

  const byMachine = useMemo(() => {
    const map = new Map<MinecoreMachineId, { count: number; d24Sum: number; cycleSum: number }>();
    for (const id of MACHINE_IDS) {
      map.set(id, { count: 0, d24Sum: 0, cycleSum: 0 });
    }
    for (const slot of state.plantSlots) {
      if (!slot.unlocked || !slot.setup.machineId) continue;
      const id = slot.setup.machineId;
      const cur = map.get(id) ?? { count: 0, d24Sum: 0, cycleSum: 0 };
      cur.count += 1;
      cur.d24Sum += computePlantDiamondsPer24h(state, slot, Date.now(), computeCtx);
      cur.cycleSum += computePlantExpectedDiamonds(state, slot, computeCtx);
      map.set(id, cur);
    }
    return map;
  }, [state, computeCtx]);

  const veinMachineGridClass = useGamesMainAdaptiveGrid({ gapClass: 'gap-2' });

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        Vein breakdown (by machine)
        <GameTooltip
          title="Vein breakdown totals"
          description="Effective D/24h applies live power efficiency to your rolling cap ceiling - plant base, rig throughput, and Crew-tab NFT bonuses (including Overclock and KREX Boost on the cap). Cycle column is one full mining run at the current setup."
        >
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600"
          >
            ?
          </button>
        </GameTooltip>
      </h3>
      <div className={veinMachineGridClass}>
        {MACHINE_IDS.map((k) => {
          const row = byMachine.get(k) ?? { count: 0, d24Sum: 0, cycleSum: 0 };
          const cfg = MINECORE_MACHINES[k];
          return (
            <div
              key={k}
              className="flex justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800"
            >
              <span className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <DiamondIcon className={`h-4 w-4 ${veinIconClass[k] ?? 'text-zinc-400'}`} />
                {cfg.label}
              </span>
              <span className="text-right font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {row.count > 0 ? (
                  <>
                    {row.count} plant{row.count === 1 ? '' : 's'} · {row.d24Sum.toLocaleString()} D/24h · {row.cycleSum.toLocaleString()}{' '}
                    / cycle
                  </>
                ) : (
                  '-'
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Footer copy on the Mining tab (progress while away + GRID link). */
export function MinecoreMiningTabFooter() {
  return (
    <p className="text-xs text-zinc-500 dark:text-zinc-400">
      Mining runs on plant timers and saved timestamps - progress continues while you are away. Refine checkpoints accrue GRID score; see{' '}
      <Link href="/rewards" className="text-emerald-600 underline dark:text-emerald-400">
        GRID rewards
      </Link>
      .
    </p>
  );
}
