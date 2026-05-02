'use client';

import { useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import * as Icons from 'lucide-react';
import type { MinecoreState } from '@/lib/game/minecore';
import type { MinecoreComputeContext } from '@/lib/game/minecore/compute-context';
import { MINECORE_PLANT_PRESETS, MINECORE_PLANT_RECHARGE_COST_KAS, MINECORE_KREX_PER_KAS } from '@/lib/game/minecore/config';
import { hasInstalledBattery } from '@/lib/game/minecore/battery-utils';
import { computeFlowRatePerMin, computeLiveBatteryChargeMs, getBatteryCapacityMs, getPowerUnitCap } from '@/lib/game/minecore/compute';
import { MinecoreVeinBreakdownByMachine } from '@/components/game/minecore/MinecoreMiningSections';

/** KAS paths use wallet sends; KREX paths use the same SKU pricing via treasury KRC-20 transfer (`payKrexTreasury`). */
const KAS_BATTERY_SYNC = 3;
const KAS_RESERVE_PACK = 6;
const RESERVE_PACK_UNITS = 3;

export function MinecorePowerPanel(props: {
  state: MinecoreState;
  now: number;
  computeCtx?: MinecoreComputeContext;
  getKasPriceAfterDiscount: (unitPriceKas: number) => number;
  onDemoTopUpFirstPlant: () => void;
  /** KAS path: paid recharge. Kept for plant list shortcuts. */
  onRechargePlant: (index: number) => void;
  onBatterySync: (slotIndex: number, currency: GameItemCurrency) => void | Promise<void>;
  onReservePack: (slotIndex: number, currency: GameItemCurrency) => void | Promise<void>;
  onRuntimeBundle: (slotIndex: number, currency: GameItemCurrency) => void | Promise<void>;
}) {
  const { state, now } = props;
  const [targetSlot, setTargetSlot] = useState(0);

  const slot = state.plantSlots[targetSlot];
  const batterySyncPrice = props.getKasPriceAfterDiscount(KAS_BATTERY_SYNC);
  const reservePackPrice = props.getKasPriceAfterDiscount(KAS_RESERVE_PACK);
  const runtimeBundlePrice = props.getKasPriceAfterDiscount(MINECORE_PLANT_RECHARGE_COST_KAS);
  const batterySyncPriceKrex = batterySyncPrice * MINECORE_KREX_PER_KAS;
  const reservePackPriceKrex = reservePackPrice * MINECORE_KREX_PER_KAS;
  const runtimeBundlePriceKrex = runtimeBundlePrice * MINECORE_KREX_PER_KAS;

  const plantsCard = (
    <GamePanelCard
      title="Plants"
      hint="Per-plant flow, battery %, and reserve units. Use Mining tab for plant setup and battery slot refills."
    >
      <ul className="space-y-2 text-sm">
        {state.plantSlots.map((p) => {
          const liveCharge = computeLiveBatteryChargeMs(p, now);
          const capMs = getBatteryCapacityMs(p, props.state, props.computeCtx);
          const batteryPct = capMs > 0 ? Math.round((liveCharge / capMs) * 100) : 0;
          const flowPerMin = computeFlowRatePerMin(props.state, p, now, props.computeCtx);
          const unitCap = getPowerUnitCap(p);

          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <div className="min-w-0 flex flex-1 flex-col gap-0.5">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Plant {p.index + 1}</span>
                {p.unlocked ? (
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{MINECORE_PLANT_PRESETS[p.type]?.label ?? p.type}</span>
                ) : null}
              </div>

              {p.unlocked ? (
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-zinc-400">Flow</span>
                    <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{flowPerMin.toFixed(1)} D/min</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold text-zinc-400">Battery</span>
                    <span
                      className={`font-mono text-sm font-bold ${
                        batteryPct > 60 ? 'text-emerald-500' : batteryPct > 20 ? 'text-amber-500' : 'text-rose-500'
                      }`}
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
                    onClick={() => props.onRechargePlant(p.index)}
                    disabled={!hasInstalledBattery(p.setup, p.type)}
                    className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-200 dark:hover:bg-sky-500/15"
                  >
                    Recharge ({MINECORE_PLANT_RECHARGE_COST_KAS} KAS)
                  </button>
                </div>
              ) : (
                <span className="text-sm font-semibold text-zinc-400">Locked</span>
              )}
            </li>
          );
        })}
      </ul>
    </GamePanelCard>
  );

  return (
    <div className="space-y-6">
      {plantsCard}

      <MinecoreVeinBreakdownByMachine state={state} computeCtx={props.computeCtx} />

      <GamePanelCard
        title="Power upgrades"
        hint="Pay with KAS (wallet) or KREX (in-game balance). Pick a plant first."
      >
        <div className="mb-4 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Plant</span>
          <select
            value={targetSlot}
            onChange={(e) => setTargetSlot(Number(e.target.value))}
            className="h-10 min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
          >
            {state.plantSlots.map((p) => (
              <option key={p.id} value={p.index} disabled={!p.unlocked}>
                Plant {p.index + 1}
                {!p.unlocked ? ' (locked)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <GameItemCard
            icon={<Icons.BatteryCharging className="h-8 w-8 text-sky-500/90" strokeWidth={1.75} />}
            title="Battery sync"
            category="Battery"
            description="Restore battery charge for one slot (matches Mining recharge)."
            effects={[
              { label: 'Effect', value: '100% charge', color: 'sky' },
              { label: 'Best for', value: 'Mid-cycle top-up' },
            ]}
            buyLabel={!slot?.unlocked ? 'Locked' : !hasInstalledBattery(slot?.setup, slot?.type) ? 'Install battery first' : 'Pay'}
            buyDisabled={!slot?.unlocked || !hasInstalledBattery(slot?.setup, slot?.type)}
            priceOptions={[
              { currency: 'KAS', unitPrice: batterySyncPrice, originalUnitPrice: KAS_BATTERY_SYNC },
              { currency: 'KREX', unitPrice: batterySyncPriceKrex },
            ]}
            onBuy={({ currency }) => {
              if (slot?.unlocked && hasInstalledBattery(slot.setup, slot.type)) void props.onBatterySync(slot.index, currency);
            }}
          />
          <GameItemCard
            icon={<Icons.Gauge className="h-8 w-8 text-amber-500/90" strokeWidth={1.75} />}
            title="Reserve pack"
            category="Capacity"
            description="Add reserve power units without a full recharge bundle."
            effects={[
              { label: 'Adds', value: `+${RESERVE_PACK_UNITS} units`, color: 'amber' },
              { label: 'Caps at', value: 'Plant max reserves' },
            ]}
            buyLabel={!slot?.unlocked ? 'Locked' : 'Pay'}
            buyDisabled={!slot?.unlocked}
            priceOptions={[
              { currency: 'KAS', unitPrice: reservePackPrice, originalUnitPrice: KAS_RESERVE_PACK },
              { currency: 'KREX', unitPrice: reservePackPriceKrex },
            ]}
            onBuy={({ currency }) => {
              if (slot?.unlocked) void props.onReservePack(slot.index, currency);
            }}
          />
          <GameItemCard
            icon={<Icons.Timer className="h-8 w-8 text-emerald-500/90" strokeWidth={1.75} />}
            title="Runtime bundle"
            category="Working time"
            description="Battery refill charge via mining recharge pricing."
            effects={[
              { label: 'Includes', value: 'Battery charge only', color: 'emerald' },
              { label: 'Nominal', value: `${MINECORE_PLANT_RECHARGE_COST_KAS} KAS` },
            ]}
            buyLabel={!slot?.unlocked ? 'Locked' : !hasInstalledBattery(slot?.setup, slot?.type) ? 'Install battery first' : 'Pay'}
            buyDisabled={!slot?.unlocked || !hasInstalledBattery(slot?.setup, slot?.type)}
            priceOptions={[
              {
                currency: 'KAS',
                unitPrice: runtimeBundlePrice,
                originalUnitPrice: MINECORE_PLANT_RECHARGE_COST_KAS,
              },
              { currency: 'KREX', unitPrice: runtimeBundlePriceKrex },
            ]}
            onBuy={({ currency }) => {
              if (slot?.unlocked && hasInstalledBattery(slot.setup, slot.type)) void props.onRuntimeBundle(slot.index, currency);
            }}
          />
        </div>
      </GamePanelCard>
    </div>
  );
}
