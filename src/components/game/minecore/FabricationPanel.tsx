'use client';

import { useState } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GameItemCard } from '@/components/games/shop/GameItemCard';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import { MINECORE_MACHINES, MINECORE_RECIPES } from '@/lib/game/minecore/config';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const s = props.state;

  const canAfford = (requires: Record<string, number>) => {
    for (const [k, v] of Object.entries(requires)) {
      const have = props.state.ingredients[k as keyof typeof props.state.ingredients] ?? 0;
      if (have < (typeof v === 'number' ? v : 0)) return false;
    }
    return true;
  };

  const recipes = MINECORE_RECIPES.filter((r) => r.kind === 'machine').map(r => ({ ...r, category: 'Machine' }));
  const categories = Array.from(new Set(recipes.map((i) => i.category)));

  const filteredItems = recipes
    .filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Inventory Section integrated into Build tab */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GamePanelCard title="Owned Assets" hint="Machines and components ready to install.">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Machines</div>
              <div className="mt-3 space-y-1 text-xs">
                {Object.entries(s.owned.machines).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">{k}</span>
                    <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Number(v).toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(s.owned.machines).length === 0 && <span className="text-zinc-500 italic">None</span>}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Batteries</div>
              <div className="mt-3 space-y-1 text-xs">
                {Object.entries(s.owned.batteries).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="font-medium text-zinc-600 dark:text-zinc-400">{k}</span>
                    <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Number(v).toLocaleString()}</span>
                  </div>
                ))}
                {Object.keys(s.owned.batteries).length === 0 && <span className="text-zinc-500 italic">None</span>}
              </div>
            </div>
          </div>
        </GamePanelCard>

        <GamePanelCard title="Raw Ingredients" hint="Used for fabrication recipes.">
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
      </div>

      <GamePanelCard title="Fabrication blueprints" hint="Machine cards show required ingredients and your current progress.">
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
          {filteredItems.map((r) => {
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
