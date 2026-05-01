'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import type { MinecoreState } from '@/lib/game/minecore';
import { MINECORE_INGREDIENT_KEYS } from '@/lib/game/minecore';

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

export function InventoryPanel(props: { state: MinecoreState }) {
  const s = props.state;
  return (
    <div className="space-y-6">
      <GamePanelCard title="Inventory" hint="Parts and ingredients you own.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Machines</div>
            <div className="mt-3 space-y-1 text-sm">
              {Object.entries(s.owned.machines).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">{k}</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Number(v).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Batteries</div>
            <div className="mt-3 space-y-1 text-sm">
              {Object.entries(s.owned.batteries).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">{k}</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Number(v).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Fabricated crew</div>
            <div className="mt-3 space-y-1 text-sm">
              {Object.entries(s.owned.workers).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">{k}</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Number(v).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/30">
            <div className="text-xs font-black uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Modules</div>
            <div className="mt-3 space-y-1 text-sm">
              {Object.entries(s.owned.modules).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">{k}</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{Number(v).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GamePanelCard>

      <GamePanelCard title="Ingredients" hint="Used for fabrication recipes.">
        <div className="grid gap-2 sm:grid-cols-2">
          {MINECORE_INGREDIENT_KEYS.map((k) => (
            <div
              key={k}
              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/30"
            >
              <span className="font-medium text-zinc-600 dark:text-zinc-400">{INGREDIENT_LABELS[k]}</span>
              <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {Math.floor(s.ingredients[k]).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </GamePanelCard>
    </div>
  );
}

