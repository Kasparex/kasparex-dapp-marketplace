'use client';

import { useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import {
  MINECORE_BATTERIES,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_RECIPES,
} from '@/lib/game/minecore/config';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { MinecoreOwnedAssetsPanel } from '@/components/game/minecore/MinecoreOwnedAssetsPanel';

const INGREDIENT_LABELS: Record<(typeof MINECORE_INGREDIENT_KEYS)[number], string> = {
  crystalDust: 'Crystal Dust',
  alloyPlates: 'Alloy Plates',
  circuitMesh: 'Circuit Mesh',
  energyCells: 'Energy Cells',
  coreShards: 'Core Shards',
  coolingGel: 'Cooling Gel',
  ariaChips: 'ARIA Chips',
  nullFragments: 'Null Fragments',
  fluxCoils: 'Flux Coils',
  latticeWire: 'Lattice Wire',
};

type EffectColor = 'emerald' | 'amber' | 'sky' | 'rose' | undefined;

export function FabricationPanel(props: {
  state: MinecoreState;
  onCraft: (recipeId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const s = props.state;

  const canAffordRecipe = (requires: Record<string, number>) => {
    for (const [k, v] of Object.entries(requires)) {
      const have = props.state.ingredients[k as keyof typeof props.state.ingredients] ?? 0;
      if (have < (typeof v === 'number' ? v : 0)) return false;
    }
    return true;
  };

  const categories = ['All', 'Machine', 'Battery', 'Module'];

  const filteredRecipes = useMemo(() => {
    const recipes = MINECORE_RECIPES.map((r) => ({
      ...r,
      category: r.kind.charAt(0).toUpperCase() + r.kind.slice(1),
    }));
    let list = recipes.filter((item) => {
      if (category !== 'all' && category !== 'All') {
        if (item.category !== category) return false;
      }
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    if (sortBy === 'price_asc') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'price_desc') list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    return list;
  }, [category, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      <MinecoreOwnedAssetsPanel state={s} />

      <GamePanelCard
        title="Fabrication blueprints"
        hint="Craft machines (power + reserve grid), batteries, and modules. Machines set draw rate, charge budget multiplier, and reserve units alongside the battery."
      >
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

            const effects: { label: string; value: string; muted?: boolean; color?: EffectColor }[] = [];

            if (isMachine) {
              const cfg = MINECORE_MACHINES[r.outputId as keyof typeof MINECORE_MACHINES];
              if (cfg) {
                effects.push({ label: 'Duration', value: `${Math.round(cfg.durationMs / 60000)} min` });
                effects.push({ label: 'Base output', value: `${cfg.baseOutput.toLocaleString()} diamonds`, color: 'amber' });
                effects.push({ label: 'Power drain', value: `×${cfg.powerConsumptionFactor}`, color: 'rose' });
                effects.push({
                  label: 'Reserve grid',
                  value: `+${cfg.powerGridContribution} (+ battery)`,
                  color: 'amber',
                });
                effects.push({
                  label: 'Charge budget',
                  value: `×${cfg.powerBudgetMultiplier.toFixed(2)}`,
                  color: 'sky',
                });
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

            const featuredImageUrl = isMachine
              ? MINECORE_MACHINES[r.outputId as keyof typeof MINECORE_MACHINES]?.featuredImageUrl
              : isBattery
                ? MINECORE_BATTERIES[r.outputId as keyof typeof MINECORE_BATTERIES]?.featuredImageUrl
                : undefined;

            return (
              <GameItemCard
                key={r.id}
                title={r.title}
                category={r.category}
                imageSrc={featuredImageUrl}
                imageAlt={r.title}
                description={
                  isMachine
                    ? 'Defines mining performance and how much reserve power the plant can hold with a battery.'
                    : isBattery
                      ? 'Stores charge and adds reserve fuel units on top of the machine grid.'
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
        </div>
      </GamePanelCard>
    </div>
  );
}
