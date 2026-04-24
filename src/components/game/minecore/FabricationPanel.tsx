'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import { MINECORE_RECIPES } from '@/lib/game/minecore/config';

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

      <GamePanelCard title="Fabrication" hint="V1 instant craft from ingredients.">
        <div className="grid gap-3 sm:grid-cols-2">
          {MINECORE_RECIPES.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{r.title}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{r.kind}</div>
                </div>
                <Tooltip content={canAfford(r.requires as any) ? 'Craft instantly from ingredients.' : 'Missing required ingredients.'}>
                  <button
                    type="button"
                    disabled={!canAfford(r.requires as any)}
                    onClick={() => props.onCraft(r.id)}
                    className="k-cta-games h-10 px-4 text-sm disabled:opacity-60"
                  >
                    Craft
                  </button>
                </Tooltip>
              </div>
              <div className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">Requires</div>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {Object.entries(r.requires).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span>{INGREDIENT_LABELS[k as keyof typeof INGREDIENT_LABELS] ?? k}</span>
                    <span className="font-mono text-xs">{Number(v).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GamePanelCard>
    </div>
  );
}

