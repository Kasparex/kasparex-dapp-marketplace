'use client';

import type { ReactNode } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';
import { MINECORE_INGREDIENT_KEYS, type MinecoreState } from '@/lib/game/minecore';
import {
  countBatteriesAssigned,
  countMachinesAssigned,
  countModuleAssignments,
  countWorkersAssigned,
  displayAssignedCount,
  MINECORE_NFT_CREW_ROLES_ORDER,
  nftCrewRoleLabel,
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

function OwnedCapsule(props: {
  label: string;
  inUse: number;
  total: number;
  accent: boolean;
  /** Shown below the main tooltip copy (e.g. NFT deck on Workers tab). */
  tooltipExtra?: ReactNode;
}) {
  const tooltipContent = (
    <div className="space-y-2">
      <p className="font-semibold">In use / Total owned</p>
      <p className="text-xs opacity-90">First number is assignments across unlocked plants; second is how many you own.</p>
      {props.tooltipExtra ? (
        <div className="border-t border-zinc-400 pt-2 text-xs dark:border-zinc-500">{props.tooltipExtra}</div>
      ) : null}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div className="flex cursor-help flex-col gap-0.5 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-medium ${props.accent ? 'text-zinc-600 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}
          >
            {props.label}
          </span>
          <span
            className={`font-mono text-sm font-black tabular-nums ${props.accent ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`}
          >
            {displayAssignedCount(props.inUse, props.total)} / {props.total}
          </span>
        </div>
      </div>
    </Tooltip>
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

function NftDeckCapsule(props: { label: string; filled: number; capacity: number }) {
  const tooltipContent = (
    <div className="space-y-2">
      <p className="font-semibold">Filled / Deck capacity</p>
      <p className="text-xs opacity-90">NFTs equipped on the Workers tab for this role vs slots on your deck.</p>
    </div>
  );
  return (
    <Tooltip content={tooltipContent}>
      <div className="flex cursor-help flex-col gap-0.5 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-zinc-600 dark:text-zinc-400">{props.label}</span>
          <span className="font-mono text-sm font-black tabular-nums text-sky-600 dark:text-sky-400">
            {props.filled} / {props.capacity}
          </span>
        </div>
      </div>
    </Tooltip>
  );
}

/** Workers tab: fabricated assignments + NFT crew decks per role. */
export function MinecoreOwnedWorkersPanel(props: {
  owned: MinecoreState['owned'];
  plantSlots: MinecoreState['plantSlots'];
  nftSlots: MinecoreState['nftSlots'];
}) {
  const slots = props.plantSlots;
  const nft = props.nftSlots ?? [];
  return (
    <GamePanelCard
      title="Assigned Workers"
      hint="Fabricated workers: inventory vs plant assignments. NFT crew: each role’s filled slots vs Workers-tab deck."
    >
      <div className="space-y-4">
        <div>
          <SectionTitle>Fabricated rigs</SectionTitle>
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
                  tooltipExtra={
                    <>
                      Same-role NFT deck: <span className="font-mono">{nftCol.filled}</span> / <span className="font-mono">{nftCol.capacity}</span>.
                    </>
                  }
                />
              );
            })}
          </div>
        </div>

        <div>
          <SectionTitle>NFT crew by role</SectionTitle>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MINECORE_NFT_CREW_ROLES_ORDER.map((role) => {
              const { filled, capacity } = nftTabSlotDeployments(nft, role);
              return (
                <NftDeckCapsule key={role} label={`${nftCrewRoleLabel(role)} (NFT)`} filled={filled} capacity={capacity} />
              );
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
