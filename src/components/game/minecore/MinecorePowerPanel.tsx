'use client';

import { useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import * as Icons from 'lucide-react';
import type { MinecoreState } from '@/lib/game/minecore';
import type { MinecoreIngredient, MinecorePowerSourceId } from '@/lib/game/minecore/types';
import { MINECORE_PLANT_RECHARGE_COST_KAS, MINECORE_POWER_SOURCES, MINECORE_POWER_SOURCE_IDS } from '@/lib/game/minecore/config';
import { computeFlowRatePerMin, computeLiveBatteryChargeMs, getBatteryCapacityMs, getPowerUnitCap } from '@/lib/game/minecore/compute';

const INGREDIENT_LABELS: Record<MinecoreIngredient, string> = {
  crystalDust: 'Crystal Dust',
  alloyPlates: 'Alloy Plates',
  circuitMesh: 'Circuit Mesh',
  energyCells: 'Energy Cells',
  coreShards: 'Core Shards',
  coolingGel: 'Cooling Gel',
  ariaChips: 'ARIA Chips',
  nullFragments: 'Null Fragments',
};

const KIND_ORDER = { thermal: 0, fission: 1, catalytic: 2, renewable: 3, exotic: 4 } as const;

function canAfford(have: MinecoreState['ingredients'], req: Partial<Record<MinecoreIngredient, number>>) {
  for (const [k, v] of Object.entries(req)) {
    if ((have[k as MinecoreIngredient] ?? 0) < (v ?? 0)) return false;
  }
  return true;
}

function kindLabel(kind: (typeof MINECORE_POWER_SOURCES)[MinecorePowerSourceId]['kind']): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function MinecorePowerPanel(props: {
  state: MinecoreState;
  now: number;
  onDemoTopUpFirstPlant: () => void;
  onRechargePlant: (index: number) => void;
  onInstallPower: (args: { slotIndex: number; powerSourceId: MinecorePowerSourceId }) => void;
}) {
  const { state, now } = props;
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [targetSlot, setTargetSlot] = useState(0);

  const categories = useMemo(
    () => [
      'All',
      'Thermal',
      'Fission',
      'Catalytic',
      'Renewable',
      'Exotic',
    ],
    [],
  );

  const list = useMemo(() => {
    return MINECORE_POWER_SOURCE_IDS.map((id) => {
      const ps = MINECORE_POWER_SOURCES[id];
      return { ...ps, kindKey: kindLabel(ps.kind) };
    });
  }, []);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let out = list.filter((ps) => {
      if (category !== 'all' && category !== 'All' && ps.kindKey !== category) return false;
      if (q && !ps.label.toLowerCase().includes(q) && !ps.lore.toLowerCase().includes(q)) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sortBy === 'price_asc') return a.maxPowerUnits - b.maxPowerUnits;
      if (sortBy === 'price_desc') return b.maxPowerUnits - a.maxPowerUnits;
      if (sortBy === 'recommended') {
        return (
          (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) || a.label.localeCompare(b.label)
        );
      }
      return 0;
    });
    return out;
  }, [list, searchQuery, category, sortBy]);

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
      <div className="grid gap-6 lg:grid-cols-2">
        <GamePanelCard
          title="Site energy"
          hint="Reserve units and live flow. Recharge a plant in mining or here with the same KAS action."
        >
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Live snapshot
            <GameTooltip
              content={
                `Each mining run uses one reserve unit. KAS recharge (${MINECORE_PLANT_RECHARGE_COST_KAS} KAS) adds unit(s) and fully refills the battery. ` +
                'Power units below are crafted from Build ingredients, then installed on a paused plant or when idle.'
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
            Use <span className="font-semibold text-zinc-800 dark:text-zinc-200">Recharge — {MINECORE_PLANT_RECHARGE_COST_KAS} KAS</span> on a plant
            to add a reserve unit and fully restore its battery, or use the Shop utility item (plant 1).
          </p>
        </GamePanelCard>
      </div>

      <GamePanelCard title="Power units" hint="Crafted from materials; install on a plant with no live run, or one that is paused.">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Install on</span>
            <select
              value={targetSlot}
              onChange={(e) => setTargetSlot(Number(e.target.value))}
              className="h-10 min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
            >
              {state.plantSlots.map((p) => (
                <option key={p.id} value={p.index} disabled={!p.unlocked}>
                  Mining plant {p.index + 1}
                  {!p.unlocked ? ' (locked)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <CardsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map((ps) => {
            const can = canAfford(state.ingredients, ps.installRequires);
            const slot = state.plantSlots[targetSlot];
            const runBlocking = slot?.cycle != null && slot.cycle.pauseBeganAtMs == null;
            const disabled = !slot?.unlocked || !can || runBlocking;
            const reqLines = Object.entries(ps.installRequires).map(([k, v]) => {
              const need = Number(v ?? 0);
              const have = Math.floor(state.ingredients[k as MinecoreIngredient] ?? 0);
              const ok = have >= need;
              const name = INGREDIENT_LABELS[k as MinecoreIngredient] ?? k;
              return { label: name, value: `${have.toLocaleString()} / ${need.toLocaleString()}`, muted: !ok };
            });
            const effects: { label: string; value: string; muted?: boolean; color?: 'emerald' | 'amber' | 'sky' }[] = [
              { label: 'Family', value: kindLabel(ps.kind) },
              { label: 'Max units', value: String(ps.maxPowerUnits), color: 'amber' },
              { label: 'Drain', value: `×${ps.drainRateMultiplier.toFixed(2)}` },
              { label: 'Energy budget', value: `×${ps.energyBudgetMultiplier.toFixed(2)}`, color: 'sky' },
              ...reqLines,
            ];
            return (
              <GameItemCard
                key={ps.id}
                icon={<Icons.Zap className="h-8 w-8 text-amber-500/80" strokeWidth={1.75} />}
                title={ps.label}
                category={kindLabel(ps.kind)}
                description={ps.lore}
                effects={effects}
                buyLabel={
                  !slot?.unlocked
                    ? 'Locked plant'
                    : runBlocking
                      ? 'Stop or pause the run first'
                      : can
                        ? 'Build and install'
                        : 'Not enough materials'
                }
                buyDisabled={disabled}
                hidePricing={true}
                priceOptions={[{ currency: 'KAS', unitPrice: 0, label: 'Materials' }]}
                onBuy={() => {
                  if (!disabled && slot) props.onInstallPower({ slotIndex: slot.index, powerSourceId: ps.id });
                }}
              />
            );
          })}
        </div>
      </GamePanelCard>

      <GamePanelCard title="Plants" hint="Status per plant; recharge uses the same KAS action as the mining tab.">
        <ul className="space-y-2 text-sm">
          {state.plantSlots.map((p) => {
            const liveCharge = computeLiveBatteryChargeMs(p, now);
            const capMs = getBatteryCapacityMs(p);
            const batteryPct = capMs > 0 ? Math.round((liveCharge / capMs) * 100) : 0;
            const flowPerMin = computeFlowRatePerMin(p, now);
            const unitCap = getPowerUnitCap(p);
            const psrc = p.setup.powerSourceId ? MINECORE_POWER_SOURCES[p.setup.powerSourceId] : null;

            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <div className="min-w-0 flex flex-col">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Mining plant {p.index + 1}</span>
                  <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {p.setup.machineId ?? 'No machine'} · {p.setup.batteryId ?? 'No battery'}
                    {psrc ? ` · ${psrc.label}` : ''}
                  </span>
                </div>

                {p.unlocked ? (
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-semibold text-zinc-400">Flow</span>
                      <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {flowPerMin.toFixed(1)} D/min
                      </span>
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
                      disabled={!p.setup.batteryId}
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
    </div>
  );
}
