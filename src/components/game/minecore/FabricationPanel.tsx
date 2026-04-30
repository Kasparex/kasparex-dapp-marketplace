'use client';

import { useMemo, useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard, type GameItemEffectLine } from '@/components/games/shop/GameItemCard';
import {
  MINECORE_INGREDIENT_KEYS,
  type MinecoreBatteryId,
  type MinecoreMachineId,
  type MinecoreModuleId,
  type MinecorePowerNodeId,
  type MinecoreState,
} from '@/lib/game/minecore';
import {
  MINECORE_BATTERIES,
  MINECORE_KW_SCALE,
  MINECORE_MACHINES,
  MINECORE_MODULES,
  MINECORE_POWER_NODES,
  MINECORE_RECIPES,
} from '@/lib/game/minecore/config';
import { MINECORE_FABRICATION_LORE } from '@/lib/game/minecore/fabrication-lore';
import { formatMinecorePowerDisplay } from '@/lib/game/minecore/plant-economy';
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
  helixStabilizers: 'Helix Stabilizers',
  plasmaConduits: 'Plasma Conduits',
  quantumAttuners: 'Quantum Attuners',
  voidglassFilaments: 'Voidglass Filaments',
};

function loreForRecipe(outputId: string, kind: string): string {
  return (
    MINECORE_FABRICATION_LORE[outputId] ??
    (kind === 'machine'
      ? 'Mining rig: sets cycle pace and how hard the plant bus runs per session.'
      : kind === 'battery'
        ? 'Energy store: holds runtime for active digs — tier and rig both decide how fast it empties.'
        : kind === 'powerNode'
          ? 'Reactor: weld it under Power to lift the plant ceiling so heavier stacks can breathe.'
          : 'Module: slots into premium or advanced frames to bend output, cycles, cooling, or refine.')
  );
}

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

  const categories = ['All', 'Machine', 'Battery', 'Module', 'Reactor'];

  const filteredRecipes = useMemo(() => {
    const recipes = MINECORE_RECIPES.map((r) => ({
      ...r,
      category:
        r.kind === 'powerNode' ? 'Reactor' : r.kind.charAt(0).toUpperCase() + r.kind.slice(1),
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
        hint="Specs mirror live plant math. Ingredients are craft-only · assign parts on Mining plants."
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
            const isPowerNode = r.kind === 'powerNode';

            const specifications: GameItemEffectLine[] = [];

            if (isMachine) {
              const cfg = MINECORE_MACHINES[r.outputId as keyof typeof MINECORE_MACHINES];
              if (cfg) {
                const consKw = cfg.powerConsumptionFactor * MINECORE_KW_SCALE;
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
                  label: 'Power consumption',
                  value: formatMinecorePowerDisplay(consKw),
                  color: 'red',
                });
                specifications.push({
                  label: 'Additional crew',
                  value: extraCrew <= 0 ? 'No' : `+${extraCrew} slots`,
                  color: 'zinc',
                });
              }
            } else if (isBattery) {
              const cfg = MINECORE_BATTERIES[r.outputId as keyof typeof MINECORE_BATTERIES];
              if (cfg) {
                specifications.push({
                  label: 'Stored runtime',
                  value: `${Math.round(cfg.chargeCapacityMs / 60000)} min`,
                  color: 'sky',
                });
                const od = cfg.powerDrawMultiplier ?? 1;
                const extraKw = Math.max(0, (od - 1) * MINECORE_KW_SCALE);
                specifications.push({
                  label: 'Power consumption',
                  value: od <= 1.001 ? 'Baseline bus load' : `+${formatMinecorePowerDisplay(extraKw)}`,
                  color: 'red',
                });
              }
            } else if (isModule) {
              const cfg = MINECORE_MODULES[r.outputId as keyof typeof MINECORE_MODULES];
              if (cfg) {
                if (cfg.kind === 'cooling') {
                  specifications.push({
                    label: 'Power consumption',
                    value: `−${Math.round((cfg.consumptionReduction ?? 0) * 100)}% draw${
                      cfg.failureReduction > 0
                        ? ` · −${Math.round(cfg.failureReduction * 100)}% strain`
                        : ''
                    }`,
                    color: 'red',
                  });
                } else if (cfg.failureReduction > 0) {
                  specifications.push({
                    label: 'Power consumption',
                    value: `−${Math.round(cfg.failureReduction * 100)}% strain`,
                    color: 'red',
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
              }
            } else if (isPowerNode) {
              const cfg = MINECORE_POWER_NODES[r.outputId as keyof typeof MINECORE_POWER_NODES];
              if (cfg) {
                specifications.push({
                  label: 'Max power',
                  value: `+${formatMinecorePowerDisplay(cfg.maxPowerKw)} (plant)`,
                  color: 'emerald',
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
                : isPowerNode
                  ? MINECORE_POWER_NODES[r.outputId as keyof typeof MINECORE_POWER_NODES]?.featuredImageUrl
                  : undefined;

            const description = loreForRecipe(r.outputId, r.kind);

            return (
              <GameItemCard
                key={r.id}
                title={r.title}
                category={r.category}
                ownedCount={ownedCountForBlueprint(s, r)}
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
