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

function ownedCountForBlueprint(state: MinecoreState, r: (typeof MINECORE_RECIPES)[number]): number {
  const id = r.outputId;
  if (r.kind === 'machine') return Math.max(0, Math.floor(state.owned.machines[id as MinecoreMachineId] ?? 0));
  if (r.kind === 'battery') return Math.max(0, Math.floor(state.owned.batteries[id as MinecoreBatteryId] ?? 0));
  if (r.kind === 'module') return Math.max(0, Math.floor(state.owned.modules[id as MinecoreModuleId] ?? 0));
  if (r.kind === 'powerNode') return Math.max(0, Math.floor(state.owned.nodes[id as MinecorePowerNodeId] ?? 0));
  return 0;
}

function loreForRecipe(outputId: string, kind: string): string {
  return (
    MINECORE_FABRICATION_LORE[outputId] ??
    (kind === 'machine'
      ? 'Mining rig: sets cycle pace, grid draw, extraction speed, and rolling cap bonuses.'
      : kind === 'battery'
        ? 'Energy store: holds nominal runtime charge; rigs do not shorten wall-clock drain. Higher tiers add capacity and efficiency.'
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
                  label: 'Mining speed',
                  value: `×${cfg.miningSpeedMultiplier.toFixed(2)} extraction`,
                  color: 'accent',
                  specTooltip:
                    'Applied while a run is active on the Mining tab. Multiplies live diamond flow toward your rolling /24h budget (same math as the plant D/min readout).',
                });
                specifications.push({
                  label: 'Plant cap (adds to base)',
                  value: `+${cfg.diamondsPer24h.toLocaleString()} D / 24h`,
                  color: 'accent',
                  specTooltip:
                    'Adds flat diamonds per 24h toward this plant’s rolling cap on the Mining tab. Stacks with plant tier, crew NFT bonuses, Overclock, and KREX Boost (cap math), then grid efficiency applies to realized D/24h.',
                });
                specifications.push({
                  label: 'Power consumption',
                  value: formatMinecorePowerDisplay(consKw),
                  color: 'red',
                  specTooltip:
                    'Grid draw for this rig at the plant. Used on the Mining tab for production vs consumption (kW balance) and mining efficiency; it does not change battery wall-clock drain.',
                });
                specifications.push({
                  label: 'Duration',
                  value: `${Math.round(cfg.durationMs / 60000)} min`,
                  color: 'sky',
                  specTooltip: 'Nominal cycle length used for expected-yield estimates; live runs can end earlier on daily cap or empty battery.',
                });
                specifications.push({
                  label: 'Additional crew',
                  value: extraCrew <= 0 ? 'No' : `+${extraCrew} slots`,
                  color: 'zinc',
                  specTooltip:
                    'Extra Worker-tab NFT rows this rig needs on the plant checklist before you can start mining.',
                });
              }
            } else if (isBattery) {
              const cfg = MINECORE_BATTERIES[r.outputId as keyof typeof MINECORE_BATTERIES];
              if (cfg) {
                specifications.push({
                  label: 'Stored runtime',
                  value: `${Math.round(cfg.chargeCapacityMs / 60000)} min`,
                  color: 'sky',
                  specTooltip:
                    'Per-slot charge budget on the Mining plant. Shown in Energy / battery pillars; longer runtime before refill at nominal 1:1 drain.',
                });
                specifications.push({
                  label: 'Cell efficiency',
                  value: `${((cfg.efficiency ?? 1) * 100).toFixed(0)}%`,
                  color: 'emerald',
                  specTooltip:
                    'Improves realized mining efficiency on the Mining tab when this cell is installed (maintenance / grid headroom interaction).',
                });
              }
            } else if (isModule) {
              const cfg = MINECORE_MODULES[r.outputId as keyof typeof MINECORE_MODULES];
              if (cfg) {
                const sid = String(r.outputId);
                const ob = cfg.outputBonus ?? 0;
                if (ob > 0 && sid !== 'krex-boost') {
                  specifications.push({
                    label: 'Mining speed',
                    value: `+${Math.round(ob * 100)}% extraction`,
                    color: 'accent',
                    specTooltip:
                      'Increases extraction rate on the Mining plant while equipped (stacked with rig mining speed). Does not change the rolling cap formula by itself.',
                  });
                }
                if (cfg.kind === 'cooling') {
                  specifications.push({
                    label: 'Power consumption',
                    value: `−${Math.round((cfg.consumptionReduction ?? 0) * 100)}% draw${
                      cfg.failureReduction > 0 ? ` · −${Math.round(cfg.failureReduction * 100)}% strain` : ''
                    }`,
                    color: 'red',
                    specTooltip:
                      'Lowers rig/module draw on this plant’s Mining tab kW balance, improving grid efficiency and maintenance strain.',
                  });
                } else if (cfg.failureReduction > 0) {
                  specifications.push({
                    label: 'Power consumption',
                    value: `−${Math.round(cfg.failureReduction * 100)}% strain`,
                    color: 'red',
                    specTooltip: 'Reduces wear strain from power stress on this plant (Mining tab efficiency interaction).',
                  });
                }
                if (cfg.kind === 'automation') {
                  specifications.push({
                    label: 'Cycle stretch',
                    value: `+${Math.round((cfg.cycleDurationBonus ?? 0) * 100)}% duration`,
                    color: 'sky',
                    specTooltip:
                      'Extends expected cycle yield window for this plant when figuring cycle diamonds (Mining / calculator).',
                  });
                  if (cfg.autoRestartMining) {
                    specifications.push({
                      label: 'Auto-restart',
                      value: 'Qualifies plant for AUTO',
                      color: 'emerald',
                      specTooltip:
                        'Together with Foreman NFT (or another auto infra source), allows AUTO on the Mining plant card to chain runs. Toggle is per plant once Foreman is deployed.',
                    });
                  }
                }
                if (cfg.kind === 'stability') {
                  specifications.push({
                    label: 'Efficiency floor',
                    value: `+${cfg.efficiencyFloorBonus ?? 0} pts`,
                    color: 'emerald',
                    specTooltip: 'Raises minimum mining efficiency on this plant while mounted (Mining tab Eff %).',
                  });
                }
                if (cfg.kind === 'refining') {
                  specifications.push({
                    label: 'Refine bonus',
                    value: `+${Math.round((cfg.refineBonus ?? 0) * 100)}%`,
                    color: 'amber',
                    specTooltip: 'Extra refinement points when you refine diamonds (Redeem workflow), not live D/min.',
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
                  specTooltip:
                    'Adds kW headroom on the assigned plant (Mining tab reactor row and power balance). Craft here, assign under the plant’s Power / reactor slot.',
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
