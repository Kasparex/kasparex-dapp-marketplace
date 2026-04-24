'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import { MINECORE_MACHINES, MINECORE_RECIPES } from '@/lib/game/minecore/config';

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

export function FabricationPanel(props: { state: MinecoreState; onCraft: (recipeId: string) => void }) {
  const canAfford = (requires: Record<string, number>) => {
    for (const [k, v] of Object.entries(requires)) {
      const have = props.state.ingredients[k as keyof typeof props.state.ingredients] ?? 0;
      if (have < (typeof v === 'number' ? v : 0)) return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <GamePanelCard title="Ingredients" hint="Craft parts to upgrade plants.">
        <div className="grid gap-2 sm:grid-cols-2">
          {MINECORE_INGREDIENT_KEYS.map((k) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/30"
            >
              <span className="font-medium text-zinc-600 dark:text-zinc-400">{INGREDIENT_LABELS[k]}</span>
              <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Math.floor(props.state.ingredients[k]).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </GamePanelCard>

      <GamePanelCard title="Build machines" hint="Machine cards show required ingredients and your current progress.">
        <div className="grid gap-4 sm:grid-cols-2">
          {MINECORE_RECIPES.filter((r) => r.kind === 'machine').map((r) => {
            const cfg = MINECORE_MACHINES[r.outputId as keyof typeof MINECORE_MACHINES];
            const effects = [
              { label: 'Duration', value: `${Math.round(cfg.durationMs / 60000)} min` },
              { label: 'Base output', value: `${cfg.baseOutput.toLocaleString()} diamonds` },
            ];

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
                category="Machine"
                description="Build instantly from ingredients. Install the machine into a plant slot after crafting."
                effects={[...effects, ...reqLines]}
                buyLabel={canAfford(r.requires as any) ? 'Build' : 'Missing'}
                buyDisabled={!canAfford(r.requires as any)}
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

