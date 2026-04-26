'use client';

import { useMemo, useState } from 'react';
import type { MinecoreState } from '@/lib/game/minecore';
import type { MinecoreIngredient, MinecorePowerSourceId } from '@/lib/game/minecore/types';
import {
  MINECORE_BATTERIES,
  MINECORE_POWER_SOURCES,
  MINECORE_POWER_SOURCE_IDS,
} from '@/lib/game/minecore/config';
import { computeFlowRatePerMin, computeLiveBatteryChargeMs, getBatteryCapacityMs, getPowerUnitCap } from '@/lib/game/minecore/compute';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';

const KIND_ORDER = { thermal: 0, fission: 1, catalytic: 2, renewable: 3, exotic: 4 } as const;

function ingredientLine(req: Partial<Record<MinecoreIngredient, number>>) {
  return Object.entries(req)
    .filter(([, n]) => (n as number) > 0)
    .map(([k, n]) => `${k}: ${n}`)
    .join(' · ');
}

function canAfford(have: MinecoreState['ingredients'], req: Partial<Record<MinecoreIngredient, number>>) {
  for (const [k, v] of Object.entries(req)) {
    if ((have[k as MinecoreIngredient] ?? 0) < (v ?? 0)) return false;
  }
  return true;
}

export function MinecorePowerPanel(props: {
  state: MinecoreState;
  now: number;
  onDemoTopUpFirstPlant: () => void;
  onRefillBattery: (index: number) => void;
  onInstallPower: (args: { slotIndex: number; powerSourceId: MinecorePowerSourceId }) => void;
}) {
  const { state, now } = props;
  const [sort, setSort] = useState<'lore' | 'capacity' | 'kind'>('kind');
  const [targetSlot, setTargetSlot] = useState(0);

  const sorted = useMemo(() => {
    const list = MINECORE_POWER_SOURCE_IDS.map((id) => MINECORE_POWER_SOURCES[id]);
    const out = [...list];
    if (sort === 'capacity') {
      out.sort((a, b) => b.maxPowerUnits - a.maxPowerUnits);
    } else if (sort === 'lore') {
      out.sort((a, b) => a.label.localeCompare(b.label));
    } else {
      out.sort(
        (a, b) =>
          (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) || a.label.localeCompare(b.label),
      );
    }
    return out;
  }, [sort]);

  let totalCap = 0;
  let totalRemaining = 0;
  let activeDraw = 0;
  let aggregateFlow = 0;

  for (const p of state.plantSlots) {
    if (!p.unlocked) continue;
    const cap = getPowerUnitCap(p);
    if (cap <= 0) continue;
    totalCap += cap;
    totalRemaining += Math.min(cap, Math.max(0, p.powerRemaining));
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
          Site power &amp; energy reserve
          <GameTooltip
            content={
              'Each new mining run spends one reserve power unit (1 KAS per top-up). Refill battery (2.5 KAS) only tops up the battery, not units. ' +
                'Power sources below use Shop ingredients: they set the unit cap, energy budget, and drain character for that plant.'
            }
          >
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600"
            >
              ?
            </button>
          </GameTooltip>
        </h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Reserve {totalRemaining.toLocaleString()} of {totalCap.toLocaleString()} power units across unlocked plants (after power-source caps) · active runs {activeDraw} ·
          flow{' '}
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{aggregateFlow.toFixed(1)} D/min</span>
          {totalCap > 0 ? (
            <>
              {' '}
              · pool{' '}
              <span className="font-semibold tabular-nums">{Math.round((totalRemaining / Math.max(1, totalCap)) * 100)}%</span>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-3">
          <GameTooltip content="Demo: add reserve to plant 1 only (KAS free path).">
            <button
              type="button"
              onClick={props.onDemoTopUpFirstPlant}
              className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-200"
            >
              Demo: +5 units on plant 1
            </button>
          </GameTooltip>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Chronicle power units</h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'lore' | 'capacity' | 'kind')}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="kind">By energy family</option>
              <option value="capacity">By max units (high → low)</option>
              <option value="lore">By name (A–Z)</option>
            </select>
            <span className="text-xs text-zinc-500">Install on</span>
            <select
              value={targetSlot}
              onChange={(e) => setTargetSlot(Number(e.target.value))}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium dark:border-zinc-700 dark:bg-zinc-900"
            >
              {state.plantSlots.map((p) => (
                <option key={p.id} value={p.index} disabled={!p.unlocked}>
                  Plant {p.index + 1}
                  {!p.unlocked ? ' (locked)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-500">
          Inspired by Kaspaland’s mapped veins, Vector’s first rigs, and Krex’s lab stacks, adapted for Minecore. Build with Shop ingredients, then install on a paused plant (or
          with no run in progress). You must stop a live run first to swap the grid.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {sorted.map((ps) => {
            const can = canAfford(state.ingredients, ps.installRequires);
            const slot = state.plantSlots[targetSlot];
            const disabled =
              !slot?.unlocked || !can || (slot.cycle != null && slot.cycle.pauseBeganAtMs == null);
            return (
              <li
                key={ps.id}
                className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80"
              >
                <div className="mb-1 text-[10px] font-medium uppercase text-zinc-400">{ps.kind}</div>
                <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">{ps.label}</div>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{ps.lore}</p>
                <div className="mt-2 space-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-500">
                  <div>
                    <span className="text-zinc-400">Max units:</span> {ps.maxPowerUnits} · <span className="text-zinc-400">Drain scale:</span> ×{ps.drainRateMultiplier.toFixed(2)} ·
                    <span className="text-zinc-400"> Energy budget:</span> ×{ps.energyBudgetMultiplier.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">{ingredientLine(ps.installRequires)}</div>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => props.onInstallPower({ slotIndex: targetSlot, powerSourceId: ps.id })}
                  className="mt-3 w-full rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {disabled && (!slot?.unlocked || (slot.cycle && slot.cycle.pauseBeganAtMs == null)) ? 'Stop run or use unlocked plant' : !can ? 'Not enough ingredients' : 'Build and install'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h4 className="mb-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300">Plants (live)</h4>
        <ul className="space-y-2 text-sm">
          {state.plantSlots.map((p) => {
            const liveCharge = computeLiveBatteryChargeMs(p, now);
            const capMs = getBatteryCapacityMs(p);
            const batteryPct = capMs > 0 ? Math.round((liveCharge / capMs) * 100) : 0;
            const flowPerMin = computeFlowRatePerMin(p, now);
            const unitCap = getPowerUnitCap(p);
            const ps = p.setup.powerSourceId ? MINECORE_POWER_SOURCES[p.setup.powerSourceId] : null;

            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Mining plant {p.index + 1}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {p.setup.machineId ?? 'No machine'} · {p.setup.batteryId ?? 'No battery'}
                    {ps ? ` · ${ps.label}` : ''}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  {p.unlocked ? (
                    <>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-semibold text-zinc-400">Flow</span>
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{flowPerMin.toFixed(1)} D/min</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-semibold text-zinc-400">Battery</span>
                        <span
                          className={`font-mono text-sm font-bold ${batteryPct > 60 ? 'text-emerald-500' : batteryPct > 20 ? 'text-amber-500' : 'text-rose-500'}`}
                        >
                          {batteryPct}%
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-semibold text-zinc-400">Units</span>
                        <span className="font-mono text-sm font-bold text-sky-500">
                          {p.powerRemaining} / {unitCap}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => props.onRefillBattery(p.index)}
                        disabled={!p.setup.batteryId}
                        className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        Refill battery
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
