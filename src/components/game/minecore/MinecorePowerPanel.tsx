'use client';

import { useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import type { GameItemCurrency } from '@/components/games/shop/GameItemCard';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import * as Icons from 'lucide-react';
import type { MinecoreState } from '@/lib/game/minecore';
import type { MinecoreComputeContext } from '@/lib/game/minecore/compute-context';
import { MINECORE_PLANT_PRESETS, MINECORE_PLANT_RECHARGE_COST_KAS, MINECORE_KREX_PER_KAS } from '@/lib/game/minecore/config';
import { hasInstalledBattery } from '@/lib/game/minecore/battery-utils';
import { computeFlowRatePerMin, computeLiveBatteryChargeMs, getBatteryCapacityMs, getPowerUnitCap } from '@/lib/game/minecore/compute';

/** KAS paid upgrades (V1 - wired to refill / top-up / recharge actions). KREX uses the same in-game actions without L1 KAS. */
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
    const flowPerMin = computeFlowRatePerMin(props.state, p, now, props.computeCtx);
    if (flowPerMin > 0) {
      activeDraw += 1;
      aggregateFlow += flowPerMin;
    }
  }

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
      hint="Reserve units, battery %, and recharge shortcuts - detailed rig/power breakdown stays on the Mining tab."
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

  const siteEnergyAndRecharge = (
    <div className="grid gap-6 lg:grid-cols-2">
      <GamePanelCard
        title="Site energy"
        hint="Reserve units and battery %. Paid refill topping up battery charge — Mining tab has slot picker."
      >
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
          Live snapshot
          <GameTooltip
            content={
              `Mining spends reserve units while draining batteries (${MINECORE_PLANT_RECHARGE_COST_KAS} KAS/slot restores charge only — no extra reserves beyond plant tier). Reserve cap follows plant tier.`
            }
          >
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600"
              aria-label="Help"
            >
              ?
            </button>
          </GameTooltip>
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Reserve {totalRemaining.toLocaleString()} of {totalCap.toLocaleString()} power units across unlocked plants · active runs {activeDraw} · flow{' '}
          <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{aggregateFlow.toFixed(1)} D/min</span>
          {totalCap > 0 ? (
            <>
              {' '}
              · pool <span className="font-semibold tabular-nums">{Math.round((totalRemaining / Math.max(1, totalCap)) * 100)}%</span>
            </>
          ) : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <GameTooltip content="Dev: add reserve units to plant 1 without KAS.">
            <button
              type="button"
              onClick={props.onDemoTopUpFirstPlant}
              className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-200"
            >
              Demo: +5 units (plant 1)
            </button>
          </GameTooltip>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Recharge" hint="Same as the mining plant KAS action.">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Same as Mining plant recharge — restores battery charge for{' '}
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{MINECORE_PLANT_RECHARGE_COST_KAS} KAS</span> per slot filled on that plant.
        </p>
      </GamePanelCard>
    </div>
  );

  return (
    <div className="space-y-6">
      {plantsCard}

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

      {siteEnergyAndRecharge}
    </div>
  );
}
