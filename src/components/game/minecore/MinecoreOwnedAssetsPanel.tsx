'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import { MINECORE_BATTERIES, MINECORE_MACHINES, MINECORE_MODULES, MINECORE_PLANT_PRESETS, MINECORE_WORKERS } from '@/lib/game/minecore/config';

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

function AssetCapsule(props: { label: string; value: string; accent: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
      <span
        className={`font-medium ${props.accent ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}
      >
        {props.label}
      </span>
      <span
        className={`font-mono font-semibold tabular-nums ${props.accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
      >
        {props.value}
      </span>
    </div>
  );
}

function SectionTitle(props: { children: string }) {
  return <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{props.children}</div>;
}

export function MinecoreOwnedAssetsPanel(props: {
  state: MinecoreState;
  walletAddress: string | null;
  isConnected: boolean;
}) {
  const { state, walletAddress, isConnected } = props;
  const walletLine =
    isConnected && walletAddress ? (
      <span className="font-mono text-zinc-700 dark:text-zinc-200">
        {walletAddress.length > 22
          ? `${walletAddress.slice(0, 12)}…${walletAddress.slice(-8)}`
          : walletAddress}
      </span>
    ) : (
      <span className="text-zinc-500">Not connected · local session</span>
    );

  return (
    <GamePanelCard
      title="Owned Assets"
      hint="Everything you can assign to plants: workers, machines, batteries, modules. Plant rows show tier and lock state."
    >
      <div className="mb-3 flex flex-col gap-1 border-b border-zinc-100 pb-3 text-[11px] dark:border-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Wallet</span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isConnected
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <div className="break-all">{walletLine}</div>
      </div>

      <div className="space-y-4">
        <div>
          <SectionTitle>Plants</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {state.plantSlots.map((slot) => {
              const tier = MINECORE_PLANT_PRESETS[slot.type];
              const accent = slot.unlocked;
              return (
                <AssetCapsule
                  key={slot.id}
                  label={`Plant ${slot.index + 1}`}
                  value={slot.unlocked ? tier.label : 'Locked'}
                  accent={accent}
                />
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Workers</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.values(MINECORE_WORKERS).map((w) => {
              const n = Number(state.owned.workers[w.id] ?? 0);
              return <AssetCapsule key={w.id} label={w.label} value={n.toLocaleString()} accent={n > 0} />;
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Machines</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.values(MINECORE_MACHINES).map((m) => {
              const n = Number(state.owned.machines[m.id] ?? 0);
              return <AssetCapsule key={m.id} label={m.label} value={n.toLocaleString()} accent={n > 0} />;
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Batteries</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.values(MINECORE_BATTERIES).map((b) => {
              const n = Number(state.owned.batteries[b.id] ?? 0);
              return <AssetCapsule key={b.id} label={b.label} value={n.toLocaleString()} accent={n > 0} />;
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Modules</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.values(MINECORE_MODULES).map((mod) => {
              const n = Number(state.owned.modules[mod.id] ?? 0);
              return <AssetCapsule key={mod.id} label={mod.label} value={n.toLocaleString()} accent={n > 0} />;
            })}
          </div>
        </div>
      </div>
    </GamePanelCard>
  );
}

/** Shop tab: same capsule layout as former Raw Ingredients; gray when quantity is 0. */
export function MinecoreOwnedIngredientsPanel(props: { ingredients: MinecoreState['ingredients'] }) {
  return (
    <GamePanelCard title="Owned Ingredients" hint="Stacks available for fabrication and on-site power installs.">
      <div className="grid grid-cols-2 gap-2">
        {MINECORE_INGREDIENT_KEYS.map((k) => {
          const n = Math.floor(props.ingredients[k] ?? 0);
          const owned = n > 0;
          return (
            <div
              key={k}
              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30"
            >
              <span
                className={`font-medium ${owned ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}
              >
                {INGREDIENT_LABELS[k]}
              </span>
              <span
                className={`font-mono font-semibold tabular-nums ${owned ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
              >
                {n.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </GamePanelCard>
  );
}
