'use client';

import { useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import type { MinecoreIngredient, MinecorePowerSourceId } from '@/lib/game/minecore/types';
import {
  MINECORE_BATTERIES,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_POWER_SOURCES,
  MINECORE_POWER_SOURCE_IDS,
  MINECORE_RECIPES,
} from '@/lib/game/minecore/config';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import * as Icons from 'lucide-react';

const INGREDIENT_LABELS: Record<(typeof MINECORE_INGREDIENT_KEYS)[number], string> = {
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

function canAffordIngredients(have: MinecoreState['ingredients'], req: Partial<Record<MinecoreIngredient, number>>) {
  for (const [k, v] of Object.entries(req)) {
    if ((have[k as MinecoreIngredient] ?? 0) < (v ?? 0)) return false;
  }
  return true;
}

function kindLabel(kind: (typeof MINECORE_POWER_SOURCES)[MinecorePowerSourceId]['kind']): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function FabricationPanel(props: {
  state: MinecoreState;
  onCraft: (recipeId: string) => void;
  onInstallPower: (args: { slotIndex: number; powerSourceId: MinecorePowerSourceId }) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [targetSlot, setTargetSlot] = useState(0);

  const s = props.state;

  const canAffordRecipe = (requires: Record<string, number>) => {
    for (const [k, v] of Object.entries(requires)) {
      const have = props.state.ingredients[k as keyof typeof props.state.ingredients] ?? 0;
      if (have < (typeof v === 'number' ? v : 0)) return false;
    }
    return true;
  };

  const categories = ['All', 'Machine', 'Battery', 'Module', 'Powerplant'];

  const filteredRecipes = useMemo(() => {
    const recipes = MINECORE_RECIPES.map((r) => ({
      ...r,
      category: r.kind.charAt(0).toUpperCase() + r.kind.slice(1),
    }));
    return recipes.filter((item) => {
      if (category !== 'all' && category !== 'All') {
        if (category === 'Powerplant') return false;
        if (item.category !== category) return false;
      }
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [category, searchQuery]);

  const filteredPower = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = MINECORE_POWER_SOURCE_IDS.map((id) => ({ ...MINECORE_POWER_SOURCES[id], kindKey: kindLabel(MINECORE_POWER_SOURCES[id].kind) }));
    if (category !== 'all' && category !== 'All' && category !== 'Powerplant') {
      return [];
    }
    list = list.filter((ps) => {
      if (q && !ps.label.toLowerCase().includes(q) && !ps.lore.toLowerCase().includes(q)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.maxPowerUnits - b.maxPowerUnits;
      if (sortBy === 'price_desc') return b.maxPowerUnits - a.maxPowerUnits;
      if (sortBy === 'recommended') {
        return (KIND_ORDER[a.kind] ?? 9) - (KIND_ORDER[b.kind] ?? 9) || a.label.localeCompare(b.label);
      }
      return 0;
    });
    return list;
  }, [category, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      <GamePanelCard title="Raw Ingredients" hint="Used for fabrication and on-site power blueprints.">
        <div className="grid grid-cols-2 gap-2">
          {MINECORE_INGREDIENT_KEYS.map((k) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30"
            >
              <span className="font-medium text-zinc-600 dark:text-zinc-400">{INGREDIENT_LABELS[k]}</span>
              <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {Math.floor(s.ingredients[k]).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </GamePanelCard>

      <GamePanelCard
        title="Fabrication blueprints"
        hint="Machines, batteries, modules, and on-site power plants — all built from materials here, then installed on a plant."
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">Install power on</span>
            <select
              value={targetSlot}
              onChange={(e) => setTargetSlot(Number(e.target.value))}
              className="h-10 min-w-[200px] rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
            >
              {s.plantSlots.map((p) => (
                <option key={p.id} value={p.index} disabled={!p.unlocked}>
                  Plant {p.index + 1}
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {filteredRecipes.map((r) => {
            const isMachine = r.kind === 'machine';
            const isBattery = r.kind === 'battery';
            const isModule = r.kind === 'module';

            const effects: { label: string; value: string; muted?: boolean; color?: 'emerald' | 'amber' | 'sky' }[] = [];

            if (isMachine) {
              const cfg = MINECORE_MACHINES[r.outputId as keyof typeof MINECORE_MACHINES];
              if (cfg) {
                effects.push({ label: 'Duration', value: `${Math.round(cfg.durationMs / 60000)} min` });
                effects.push({ label: 'Base output', value: `${cfg.baseOutput.toLocaleString()} diamonds`, color: 'amber' });
                effects.push({ label: 'Power drain', value: `×${cfg.powerConsumptionFactor}` });
              }
            } else if (isBattery) {
              const cfg = MINECORE_BATTERIES[r.outputId as keyof typeof MINECORE_BATTERIES];
              if (cfg) {
                effects.push({ label: 'Capacity', value: `${Math.round(cfg.chargeCapacityMs / 60000)} min` });
                effects.push({ label: 'Fuel units', value: `${cfg.powerCapacity} units`, color: 'amber' });
                effects.push({ label: 'Efficiency', value: `×${cfg.efficiency}` });
              }
            } else if (isModule) {
              const cfg = MINECORE_MODULES[r.outputId as keyof typeof MINECORE_MODULES];
              if (cfg) {
                effects.push({ label: 'Output +', value: `${Math.round(cfg.outputBonus * 100)}%`, color: 'amber' });
                effects.push({ label: 'Stability', value: `${Math.round(cfg.failureReduction * 100)}%` });
              }
            }

            const reqLines = Object.entries(r.requires).map(([k, v]) => {
              const need = Number(v ?? 0);
              const have = Math.floor(props.state.ingredients[k as keyof typeof props.state.ingredients] ?? 0);
              const ok = have >= need;
              const name = INGREDIENT_LABELS[k as keyof typeof INGREDIENT_LABELS] ?? k;
              return { label: name, value: `${have.toLocaleString()} / ${need.toLocaleString()}`, muted: !ok };
            });

            return (
              <GameItemCard
                key={r.id}
                title={r.title}
                category={r.category}
                description={
                  isMachine
                    ? 'Install in a plant to run mining cycles.'
                    : isBattery
                      ? 'Powers machines; larger packs run longer.'
                      : 'Optional output and stability upgrade for a plant.'
                }
                effects={[...effects, ...reqLines]}
                buyLabel={canAffordRecipe(r.requires as Record<string, number>) ? 'Build' : 'Missing'}
                buyDisabled={!canAffordRecipe(r.requires as Record<string, number>)}
                hidePricing={true}
                priceOptions={[{ currency: 'KAS', unitPrice: 0, label: 'Build' }]}
                onBuy={() => props.onCraft(r.id)}
              />
            );
          })}

          {filteredPower.map((ps) => {
            const can = canAffordIngredients(s.ingredients, ps.installRequires);
            const slot = s.plantSlots[targetSlot];
            const runBlocking = slot?.cycle != null && slot.cycle.pauseBeganAtMs == null;
            const disabled = !slot?.unlocked || !can || runBlocking;
            const reqLines = Object.entries(ps.installRequires).map(([k, v]) => {
              const need = Number(v ?? 0);
              const have = Math.floor(s.ingredients[k as MinecoreIngredient] ?? 0);
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
    </div>
  );
}
