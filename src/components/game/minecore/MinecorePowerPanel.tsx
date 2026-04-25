'use client';

import type { MinecoreState } from '@/lib/game/minecore';
import { MINECORE_BATTERIES, MINECORE_MACHINES } from '@/lib/game/minecore/config';
import { computePlantExpectedDiamonds, computeFlowRatePerMin, computeLiveBatteryChargeMs, getBatteryCapacityMs } from '@/lib/game/minecore/compute';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

export function MinecorePowerPanel(props: {
  state: MinecoreState;
  now: number;
  onDemoTopUpFirstPlant: () => void;
  onRefillBattery: (index: number) => void;
}) {
  const { state, now } = props;

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
    
    // Use the same compute functions as the card for consistency
    const flowPerMin = computeFlowRatePerMin(p, now);
    if (flowPerMin > 0) {
      activeDraw += 1;
      aggregateFlow += flowPerMin;
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Site power & battery budget
          <GameTooltip content="Each active mining cycle draws from your plants’ power units. Additionally, machines drain battery charge in real-time. Use high-tier batteries to last longer.">
            <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
              ?
            </button>
          </GameTooltip>
        </h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Reserve {totalRemaining.toLocaleString()} of {totalCap.toLocaleString()} power units across plants · active cycles {activeDraw} · aggregate flow{' '}
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{aggregateFlow.toFixed(1)} D/min</span>
          {totalCap > 0 ? (
            <>
              {' '}
              · unit reserve{' '}
              <span className="font-semibold tabular-nums">{Math.round((totalRemaining / Math.max(1, totalCap)) * 100)}%</span>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-3">
          <GameTooltip content="Demo: adds reserve to the first plant slot so you can start a cycle without a KAS receipt.">
            <button type="button" onClick={props.onDemoTopUpFirstPlant} className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
              Demo: top up plant 1 (+5 units)
            </button>
          </GameTooltip>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Mining plants</h4>
        <ul className="space-y-2 text-sm">
          {state.plantSlots.map((p) => {
            const liveCharge = computeLiveBatteryChargeMs(p, now);
            const capMs = getBatteryCapacityMs(p);
            const batteryPct = capMs > 0 ? Math.round((liveCharge / capMs) * 100) : 0;
            const flowPerMin = computeFlowRatePerMin(p, now);
            const unitCap = p.setup.batteryId ? (MINECORE_BATTERIES[p.setup.batteryId]?.powerCapacity ?? 0) : 0;

            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Mining Plant {p.index + 1}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{p.setup.machineId ?? 'No machine'} · {p.setup.batteryId ?? 'No battery'}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-6">
                  {p.unlocked ? (
                    <>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Flow</span>
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{flowPerMin.toFixed(1)} D/min</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Battery</span>
                        <span className={`font-mono text-sm font-bold ${batteryPct > 60 ? 'text-emerald-500' : batteryPct > 20 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {batteryPct}%
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Units</span>
                        <span className="font-mono text-sm font-bold text-sky-500">{p.powerRemaining} / {unitCap}</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => props.onRefillBattery(p.index)}
                        disabled={!p.setup.batteryId}
                        className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Refill
                      </button>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-zinc-400">Locked</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
