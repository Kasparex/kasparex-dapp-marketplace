'use client';

import { useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard, type GameItemEffectLine } from '@/components/games/shop/GameItemCard';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import {
  MINECORE_BATTERIES,
  MINECORE_KW_SCALE,
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
      if (!(MINECORE_INGREDIENT_KEYS as readonly string[]).includes(k)) continue;
      const need = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : 0;
      const have = Math.floor(props.state.ingredients[k as keyof typeof props.state.ingredients] ?? 0);
      if (have < need) return false;
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
        hint="Specifications match the mining plant control panel: kW, drain, and rig pace feed the same formulas as an installed plant. Ingredients are only for crafting."
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

            const specifications: GameItemEffectLine[] = [];

            if (isMachine) {
              const cfg = MINECORE_MACHINES[r.outputId as keyof typeof MINECORE_MACHINES];
              if (cfg) {
                const consKw = cfg.powerConsumptionFactor * MINECORE_KW_SCALE;
                const busKw = cfg.powerGridContribution * MINECORE_KW_SCALE;
                const extraCrew = cfg.additionalCrewRequired ?? 0;
                specifications.push({
                  label: 'Duration',
                  value: `${Math.round(cfg.durationMs / 60000)} min`,
                  color: 'sky',
                });
                specifications.push({
                  label: 'Plant cap (adds to base)',
                  value: `+${cfg.diamondsPer24h.toLocaleString()} D / 24h`,
                  color: 'amber',
                });
                specifications.push({
                  label: 'Power drain',
                  value: `×${cfg.powerConsumptionFactor}`,
                  color: 'rose',
                });
                specifications.push({
                  label: 'Additional crew',
                  value: extraCrew <= 0 ? 'No' : `+${extraCrew} slots`,
                  color: 'zinc',
                });
                specifications.push({
                  label: 'Energy consumption',
                  value: `${consKw.toFixed(1)} kW`,
                  color: 'rose',
                });
                specifications.push({
                  label: 'Plant bus (kW)',
                  value: `+${busKw.toFixed(0)} kW`,
                  color: 'sky',
                });
                specifications.push({
                  label: 'Charge budget',
                  value: `×${cfg.powerBudgetMultiplier.toFixed(2)}`,
                  color: 'sky',
                });
              }
            } else if (isBattery) {
              const cfg = MINECORE_BATTERIES[r.outputId as keyof typeof MINECORE_BATTERIES];
              if (cfg) {
                specifications.push({
                  label: 'Stored runtime',
                  value: `${Math.round(cfg.chargeCapacityMs / 60000)} min @ 1.0× drain`,
                  color: 'sky',
                });
                specifications.push({
                  label: 'Reserve power units',
                  value: 'Plant tier only (V1)',
                  color: 'amber',
                });
                specifications.push({
                  label: 'Yield multiplier',
                  value: `×${cfg.efficiency} (rolling cap)`,
                  color: 'emerald',
                });
              }
            } else if (isModule) {
              const cfg = MINECORE_MODULES[r.outputId as keyof typeof MINECORE_MODULES];
              if (cfg) {
                if (cfg.kind === 'output') {
                  specifications.push({
                    label: 'Output bonus',
                    value: `+${Math.round(cfg.outputBonus * 100)}% (stacked in plant cap)`,
                    color: 'amber',
                  });
                }
                if (cfg.kind === 'cooling') {
                  specifications.push({
                    label: 'Consumption cut',
                    value: `−${Math.round((cfg.consumptionReduction ?? 0) * 100)}% kW`,
                    color: 'sky',
                  });
                }
                if (cfg.kind === 'automation') {
                  specifications.push({
                    label: 'Cycle stretch',
                    value: `+${Math.round((cfg.cycleDurationBonus ?? 0) * 100)}% duration`,
                    color: 'sky',
                  });
                  if (cfg.autoRestartMining) {
                    specifications.push({
                      label: 'Auto-restart',
                      value: 'Needs Workers toggle + this module',
                      color: 'emerald',
                    });
                  }
                }
                if (cfg.kind === 'stability') {
                  specifications.push({
                    label: 'Efficiency floor',
                    value: `+${cfg.efficiencyFloorBonus ?? 0} pts`,
                    color: 'emerald',
                  });
                }
                if (cfg.kind === 'refining') {
                  specifications.push({
                    label: 'Refine bonus',
                    value: `+${Math.round((cfg.refineBonus ?? 0) * 100)}%`,
                    color: 'amber',
                  });
                }
                specifications.push({
                  label: 'Failure reduction',
                  value: `−${Math.round(cfg.failureReduction * 100)}%`,
                  color: 'zinc',
                });
              }
            }

            const ingredients: GameItemEffectLine[] = Object.entries(r.requires)
              .filter(([k]) => (MINECORE_INGREDIENT_KEYS as readonly string[]).includes(k))
              .map(([k, v]) => {
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

            const description = isMachine
              ? 'Nominal cycle length for one run. If power drain is above 1.0×, the battery empties sooner in real time (same cycle window, faster charge loss). Output stacks with plant base in the live economy.'
              : isBattery
                ? 'Production kW and power-unit capacity add to the plant grid total and efficiency math. Battery charge still drains during runs based on the machine’s drain factor.'
                : 'Install on Premium/Advanced plants. Affects output, kW balance, cycles, or refining per module type.';

            return (
              <GameItemCard
                key={r.id}
                title={r.title}
                category={r.category}
                imageSrc={featuredImageUrl}
                imageAlt={r.title}
                description={description}
                specifications={specifications}
                ingredients={ingredients}
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
