'use client';

import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import {
  countBatteriesAssigned,
  countMachinesAssigned,
  countModuleAssignments,
  countWorkersAssigned,
  nftTabSlotDeployments,
} from '@/lib/game/minecore/asset-usage';
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
  fluxCoils: 'Flux Coils',
  latticeWire: 'Lattice Wire',
};

function OwnedCapsule(props: { label: string; inUse: number; total: number; accent: boolean; footnote?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-medium ${props.accent ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          {props.label}
        </span>
        <span
          className={`font-mono text-sm font-black tabular-nums ${props.accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
        >
          {props.inUse} / {props.total}
        </span>
      </div>
      <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
        {props.footnote ?? `${props.inUse} assigned · ${props.total} owned`}
      </div>
    </div>
  );
}

function PlantCapsule(props: { label: string; value: string; accent: boolean }) {
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

/** Build tab: plant tiers plus fabricatable parts with in-use / owned counts. */
export function MinecoreOwnedAssetsPanel(props: { state: MinecoreState }) {
  const { state } = props;
  const slots = state.plantSlots;

  return (
    <GamePanelCard
      title="Owned Assets"
      hint="Plants you operate and parts you can assign. In use counts assignments across all unlocked plants."
    >
      <div className="space-y-4">
        <div>
          <SectionTitle>Plants</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {state.plantSlots.map((slot) => {
              const tier = MINECORE_PLANT_PRESETS[slot.type];
              const accent = slot.unlocked;
              return (
                <PlantCapsule
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
          <SectionTitle>Machines</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(MINECORE_MACHINES).map((m) => {
              const total = Number(state.owned.machines[m.id] ?? 0);
              const inUse = countMachinesAssigned(slots, m.id);
              return <OwnedCapsule key={m.id} label={m.label} inUse={inUse} total={total} accent={total > 0} />;
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Batteries</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(MINECORE_BATTERIES).map((b) => {
              const total = Number(state.owned.batteries[b.id] ?? 0);
              const inUse = countBatteriesAssigned(slots, b.id);
              return <OwnedCapsule key={b.id} label={b.label} inUse={inUse} total={total} accent={total > 0} />;
            })}
          </div>
        </div>

        <div>
          <SectionTitle>Modules</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(MINECORE_MODULES).map((mod) => {
              const total = Number(state.owned.modules[mod.id] ?? 0);
              const inUse = countModuleAssignments(slots, mod.id);
              return <OwnedCapsule key={mod.id} label={mod.label} inUse={inUse} total={total} accent={total > 0} />;
            })}
          </div>
        </div>
      </div>
    </GamePanelCard>
  );
}

/** Workers tab: fabricated workers on plants + NFT crew slots (Workers tab). */
export function MinecoreOwnedWorkersPanel(props: {
  owned: MinecoreState['owned'];
  plantSlots: MinecoreState['plantSlots'];
  nftSlots: MinecoreState['nftSlots'];
}) {
  const slots = props.plantSlots;
  const nft = props.nftSlots ?? [];
  const foreman = nftTabSlotDeployments(nft, 'foreman');
  const engineer = nftTabSlotDeployments(nft, 'engineer');
  return (
    <GamePanelCard
      title="Owned workers"
      hint="Fabricated Worker/Operator counts show plant assignments. NFT rows show Workers-tab crew decks (1 NFT per slot when filled)."
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(MINECORE_WORKERS).map((w) => {
          const total = Number(props.owned.workers[w.id] ?? 0);
          const inUse = countWorkersAssigned(slots, w.id);
          const nftCol = nftTabSlotDeployments(nft, w.id);
          return (
            <OwnedCapsule
              key={w.id}
              label={`${w.label} (fabricated)`}
              inUse={inUse}
              total={total}
              accent={total > 0 || inUse > 0}
              footnote={`NFT tab ${nftCol.filled}/${nftCol.capacity}`}
            />
          );
        })}
        <OwnedCapsule
          key="foreman"
          label="Foreman (NFT)"
          inUse={foreman.filled}
          total={foreman.capacity}
          accent={foreman.filled > 0}
          footnote="Workers tab slot"
        />
        <OwnedCapsule
          key="engineer"
          label="Engineer (NFT)"
          inUse={engineer.filled}
          total={engineer.capacity}
          accent={engineer.filled > 0}
          footnote="Workers tab slot"
        />
      </div>
    </GamePanelCard>
  );
}

/** Shop tab: same capsule layout as former Raw Ingredients; gray when quantity is 0. */
export function MinecoreOwnedIngredientsPanel(props: { ingredients: MinecoreState['ingredients'] }) {
  return (
    <GamePanelCard title="Owned Ingredients" hint="Start at zero — purchase stacks in Shop to fabricate rigs and batteries.">
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
