'use client';

import { useMemo, useState } from 'react';
import {
  CALC_BATTERY_ORDER,
  CALC_BOOST_ORDER,
  CALC_MACHINE_ORDER,
  CALC_MODULE_ORDER,
  CALC_PLANT_TYPE_ORDER,
  CALC_WORKER_TIER_ORDER,
  runMinecoreCalculator,
} from '@/lib/game/minecore/calculator';
import type { MinecoreModuleId, PlantSetup } from '@/lib/game/minecore';
import {
  MINECORE_MACHINES,
  MINECORE_BATTERIES,
  MINECORE_BOOSTS,
  MINECORE_PLANT_PRESETS,
  MINECORE_PLANT_BASE_POWER_UNITS,
  MINECORE_GRID_REDEEM_RATE,
  MINECORE_MODULES,
} from '@/lib/game/minecore';

function SliderRow(props: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  valueLabel: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{props.label}</span>
          {props.hint ? <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{props.hint}</p> : null}
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">{props.valueLabel}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={1}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-emerald-600 dark:bg-zinc-700 dark:accent-emerald-500"
      />
    </div>
  );
}

function Stat(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/50">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{props.label}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{props.value}</div>
      {props.sub ? <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{props.sub}</div> : null}
    </div>
  );
}

export function MinecoreCalculator() {
  const [machineIdx, setMachineIdx] = useState(1);
  const [batteryIdx, setBatteryIdx] = useState(0);
  const [workerIdx, setWorkerIdx] = useState(0);
  const [boostIdx, setBoostIdx] = useState(0);
  const [plantTypeIdx, setPlantTypeIdx] = useState(0);
  const [plantCount, setPlantCount] = useState(1);
  const [kasDiscountPct, setKasDiscountPct] = useState(0);
  const [modulesOn, setModulesOn] = useState<Record<MinecoreModuleId, boolean>>(() =>
    Object.fromEntries(CALC_MODULE_ORDER.map((id) => [id, false])) as Record<MinecoreModuleId, boolean>,
  );

  const plantType = CALC_PLANT_TYPE_ORDER[plantTypeIdx] ?? 'standard';

  const setup: PlantSetup = useMemo(() => {
    const moduleIds = CALC_MODULE_ORDER.filter((id) => modulesOn[id]);
    const n = Math.max(1, MINECORE_PLANT_BASE_POWER_UNITS[plantType] ?? 1);
    const batteryPick = CALC_BATTERY_ORDER[batteryIdx] ?? null;
    return {
      machineId: CALC_MACHINE_ORDER[machineIdx] ?? null,
      batteryIds: Array.from({ length: n }, () => batteryPick),
      workerNftDeckSlotIndices: [0],
      moduleIds,
      boostId: CALC_BOOST_ORDER[boostIdx] ?? 'none',
    };
  }, [machineIdx, batteryIdx, boostIdx, modulesOn, plantType]);

  const result = useMemo(
    () =>
      runMinecoreCalculator({
        setup,
        plantType,
        plantCount,
        kasDiscountPct,
        workerTier: CALC_WORKER_TIER_ORDER[workerIdx] ?? 'regular',
      }),
    [setup, plantType, plantCount, kasDiscountPct, workerIdx],
  );

  const machine = setup.machineId ? MINECORE_MACHINES[setup.machineId] : null;
  const primaryBatteryId = setup.batteryIds[0] ?? null;
  const battery = primaryBatteryId ? MINECORE_BATTERIES[primaryBatteryId] : null;
  const workerTierLabel = CALC_WORKER_TIER_ORDER[workerIdx] ?? 'regular';
  const boost = MINECORE_BOOSTS[setup.boostId];
  const preset = MINECORE_PLANT_PRESETS[plantType];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Plant build</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Drag sliders - results use the same math as the live game (yield, battery cap, drain).</p>

          <div className="mt-5 space-y-5">
            <SliderRow
              label="Machine"
              min={0}
              max={CALC_MACHINE_ORDER.length - 1}
              value={machineIdx}
              onChange={setMachineIdx}
              valueLabel={machine?.label ?? '-'}
            />
            <SliderRow
              label="Battery"
              min={0}
              max={CALC_BATTERY_ORDER.length - 1}
              value={batteryIdx}
              onChange={setBatteryIdx}
              valueLabel={battery?.label ?? '-'}
            />
            <SliderRow
              label="Worker NFT tier"
              min={0}
              max={CALC_WORKER_TIER_ORDER.length - 1}
              value={workerIdx}
              onChange={setWorkerIdx}
              valueLabel={workerTierLabel}
            />
            <SliderRow
              label="Boost"
              hint="KAS Overclock is +100% in-game; KREX / GRID boosts use the same multipliers as config."
              min={0}
              max={CALC_BOOST_ORDER.length - 1}
              value={boostIdx}
              onChange={setBoostIdx}
              valueLabel={boost.label}
            />
            <SliderRow
              label="Plant tier"
              hint="One-time KAS upgrade per slot (game preset)."
              min={0}
              max={CALC_PLANT_TYPE_ORDER.length - 1}
              value={plantTypeIdx}
              onChange={setPlantTypeIdx}
              valueLabel={`${preset.label} (${preset.costKas === 0 ? 'free' : `${preset.costKas} KAS`})`}
            />
            <SliderRow
              label="Parallel plants"
              hint="Same build copied across unlocked slots (max 4 default)."
              min={1}
              max={4}
              value={plantCount}
              onChange={setPlantCount}
              valueLabel={`${plantCount}×`}
            />
            <SliderRow
              label="KAS shop discount"
              hint="Approximates KREX tier % off ingredient / upgrade KAS prices."
              min={0}
              max={50}
              value={kasDiscountPct}
              onChange={setKasDiscountPct}
              valueLabel={`${kasDiscountPct}%`}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Modules</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Toggle modules included in the build (stacks all output bonuses).</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CALC_MODULE_ORDER.map((id) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:hover:bg-zinc-800/50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  checked={modulesOn[id]}
                  onChange={(e) => setModulesOn((m) => ({ ...m, [id]: e.target.checked }))}
                />
                <span className="text-zinc-800 dark:text-zinc-100">{MINECORE_MODULES[id].label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/5 to-transparent p-5 dark:from-emerald-500/10">
          <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Cycle output</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Diamonds (this cycle)"
              value={result.diamondsThisCycle.toLocaleString()}
              sub={
                result.batteryLimitsCycle
                  ? `Battery-limited vs ${result.expectedDiamondsFullCycle.toLocaleString()} full cycle`
                  : `Full cycle (${result.cycleDurationLabel})`
              }
            />
            <Stat label="Refinement points (if refined)" value={Math.floor(result.refinementPointsPerCycle).toLocaleString()} sub="1 diamond → 1 point (v1)" />
            <Stat
              label="GRID redeem (config ratio)"
              value={result.gridRedeemablePerCycle.toLocaleString()}
              sub={`MINECORE_GRID_REDEEM_RATE = ${MINECORE_GRID_REDEEM_RATE}× points`}
            />
            <Stat
              label="Redeem UI preview (GRID)"
              value={result.redeemGridPreview.toLocaleString()}
              sub="Rewards tab: points × GRID rate from Minecore config"
            />
            <Stat
              label="Redeem UI preview (KREX)"
              value={result.redeemKrexPreview.toLocaleString()}
              sub="Rewards tab: points × KREX rate from Minecore config"
            />
            <Stat
              label="Flow (while battery & cycle active)"
              value={`${result.flowDiamondsPerMinute.toFixed(2)} D/min`}
              sub="Same linear rate as in-game progress bar"
            />
          </div>
          <div className="mt-4 rounded-xl border border-zinc-200/80 bg-white/60 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200">Timing</div>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Cycle length: {result.cycleDurationLabel}</li>
              <li>Battery budget: {result.batteryCapacityLabel} (× machine charge budget)</li>
              <li>Drain scale: ×{result.drainScale.toFixed(3)} (machine draw)</li>
              <li>Runtime at full charge: {result.batteryRuntimeLabel}</li>
              <li>Reserve cap: {result.reserveCap} units</li>
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Throughput & costs (est.)</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat
              label="Diamonds / hour (1 plant)"
              value={result.diamondsPerHourOnePlant.toFixed(1)}
              sub="Assumes immediate restart after extract; uses battery-limited yield"
            />
            <Stat
              label="Diamonds / hour (all plants)"
              value={result.diamondsPerHourAllPlants.toFixed(1)}
              sub={`${plantCount} identical plants`}
            />
            <Stat
              label="Refinement pts / hour (all)"
              value={result.refinementPointsPerHourAllPlants.toFixed(1)}
              sub="If all output is refined"
            />
            <Stat
              label="KAS / recharge (discounted)"
              value={`${result.kasPerRechargeDiscounted} KAS`}
              sub={`Nominal ${result.kasPerRecharge} KAS · battery refill`}
            />
            <Stat label="Plant upgrade (discounted)" value={`${result.plantUpgradeKasDiscounted} KAS`} sub={`Nominal ${result.plantUpgradeKas} KAS · ${preset.label}`} />
            <Stat label="Slot unlock (game SKU)" value={`${result.slotUnlockKas} KAS`} sub="First unlock per slot" />
            <Stat label="Slot expand (game SKU)" value={`${result.slotExpandKas} KAS`} sub="Add locked slot row" />
          </div>
          {setup.boostId === 'kas-overclock' ? (
            <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-400">
              KAS Overclock is purchased separately in the shop (5 KAS base in UI) - not added to the totals above.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
