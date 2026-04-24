'use client';

import type { MinecoreState } from '@/lib/game/minecore';
import { MINECORE_BATTERIES, MINECORE_MACHINES } from '@/lib/game/minecore/config';
import { computePlantExpectedDiamonds } from '@/lib/game/minecore/compute';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

export function MinecorePowerPanel(props: {
  state: MinecoreState;
  onDemoTopUpFirstPlant: () => void;
}) {
  const { state } = props;
  const now = Date.now();

  let totalCap = 0;
  let totalRemaining = 0;
  let activeDraw = 0;
  let aggregateFlow = 0;

  for (const p of state.plantSlots) {
    if (!p.unlocked || !p.setup.batteryId) continue;
    const b = MINECORE_BATTERIES[p.setup.batteryId];
    const cap = b?.powerCapacity ?? 0;
    totalCap += cap;
    totalRemaining += Math.min(cap, Math.max(0, p.powerRemaining));
    if (p.cycle && now < p.cycle.endAtMs) {
      activeDraw += 1;
      aggregateFlow += p.cycle.expectedDiamonds / Math.max(1, p.cycle.durationMs);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Site power budget
          <GameTooltip content="Each active mining cycle draws from your plants’ power reserves. Top up individual plants from the Mining tab or use the demo control below.">
            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
              ?
            </button>
          </GameTooltip>
        </h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Reserve {totalRemaining.toLocaleString()} of {totalCap.toLocaleString()} power units across unlocked plants · active cycles {activeDraw} · aggregate flow{' '}
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{aggregateFlow.toFixed(3)} D/s</span>
          {totalCap > 0 ? (
            <>
              {' '}
              · reserve health{' '}
              <span className="font-semibold tabular-nums">{Math.round((totalRemaining / Math.max(1, totalCap)) * 100)}%</span>
            </>
          ) : null}
        </p>
        <GameTooltip content="Demo: adds reserve to the first plant slot so you can start a cycle without a KAS receipt.">
          <button type="button" onClick={props.onDemoTopUpFirstPlant} className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
            Demo: top up plant 1 (+5 power)
          </button>
        </GameTooltip>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Power plants</h4>
        <ul className="space-y-2 text-sm">
          {state.plantSlots.map((p) => {
            const cap = p.setup.batteryId ? (MINECORE_BATTERIES[p.setup.batteryId]?.powerCapacity ?? 0) : 0;
            const machineDuration = p.setup.machineId ? (MINECORE_MACHINES[p.setup.machineId]?.durationMs ?? 0) : 0;
            const idleExpected = computePlantExpectedDiamonds(state, p);
            const idleFlow = machineDuration > 0 && idleExpected > 0 ? idleExpected / machineDuration : 0;
            const displayFlow =
              p.cycle && now < p.cycle.endAtMs ? p.cycle.expectedDiamonds / Math.max(1, p.cycle.durationMs) : idleFlow;

            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Power Plant {p.index + 1}</span>
                <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                  {p.unlocked ? (
                    <>
                      Flow <span className="font-semibold text-emerald-600 dark:text-emerald-400">{displayFlow.toFixed(3)} D/s</span>
                      {' · '}
                      Power {p.powerRemaining.toLocaleString()} / {cap.toLocaleString()}
                    </>
                  ) : (
                    'Locked'
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
