'use client';

import { useState, useMemo } from 'react';
import type { MiningSlot } from '@/lib/game/engine';
import { getBonusForTrait, getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { WORKER_TIER_MULTIPLIERS, OPERATOR_TIER_MULTIPLIERS } from '@/lib/game/diamond-veins-config';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { NFTSlotSelector } from '@/components/game/NFTSlotSelector';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';

export function WorkersPanel(props: {
  slots: MiningSlot[];
  slottedMetadata: Record<number, ParsedNFTMetadata>;
  autoRestart: boolean;
  /** True when Foreman is active or a plant has Regen Coil (automation can actually chain cycles). */
  autoRestartInfrastructureActive: boolean;
  onToggleAutoRestart: (enabled: boolean) => void;
  onDeploy: (slotIndex: number, nftId: number, collection: string) => void;
  onRemove: (slotIndex: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const filteredSlots = useMemo(() => {
    let list = props.slots.map((s, idx) => ({ ...s, originalIndex: idx }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(slot => {
        const meta = slot.nftId !== null ? props.slottedMetadata[slot.nftId] : null;
        return (
          slot.type.toLowerCase().includes(q) ||
          slot.nftId?.toString().includes(q) ||
          meta?.name?.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'Active') list = list.filter(s => s.nftId !== null);
      if (statusFilter === 'Empty') list = list.filter(s => s.nftId === null);
      if (statusFilter === 'Worker') list = list.filter(s => s.type === 'worker');
      if (statusFilter === 'Operator') list = list.filter(s => s.type === 'operator');
      if (statusFilter === 'Foreman') list = list.filter(s => s.type === 'foreman');
    }

    // Recommended is original index
    if (sortBy === 'price_asc') {
      // In workers case, maybe sort by ID or yield? Let's do ID
      list.sort((a, b) => (a.nftId ?? 0) - (b.nftId ?? 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.nftId ?? 0) - (a.nftId ?? 0));
    }

    return list;
  }, [props.slots, searchQuery, statusFilter, sortBy, props.slottedMetadata]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Auto-restart mining runs
            <GameTooltip content="Requires Regen Coil + toggle, or a Foreman NFT. Otherwise runs still finish manually.">
              <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold dark:border-zinc-600">
                ?
              </button>
            </GameTooltip>
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Opt-in for future auto-chaining when infrastructure is ready.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-label={props.autoRestart ? 'Disable auto-restart mining' : 'Enable auto-restart mining'}
          aria-checked={props.autoRestart}
          onClick={() => props.onToggleAutoRestart(!props.autoRestart)}
          className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
            props.autoRestart ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-7 w-7 rounded-full bg-white shadow transition ${
              props.autoRestart ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {props.autoRestart && !props.autoRestartInfrastructureActive ? (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">No auto-chain yet — add Regen Coil or Foreman NFT.</p>
      ) : null}

      <CardsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={statusFilter}
        onCategoryChange={setStatusFilter}
        categories={['Active', 'Empty', 'Worker', 'Operator', 'Foreman']}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredSlots.map((slot) => {
          const idx = slot.originalIndex;
          const meta = slot.nftId !== null ? props.slottedMetadata[slot.nftId] : null;
          const tier = slot.nftId !== null && slot.collection ? getNFTTier(slot.collection, slot.nftId, meta) : null;
          const tierKey = (tier ?? 'regular') as keyof typeof WORKER_TIER_MULTIPLIERS;
          const workerMult = slot.type === 'worker' ? (WORKER_TIER_MULTIPLIERS[tierKey] ?? 1) : null;
          const operatorMult = slot.type === 'operator' ? (OPERATOR_TIER_MULTIPLIERS[tierKey] ?? 2) : null;
          const traitBonus = meta?.traits?.reduce((sum, t) => sum + (getBonusForTrait(String(t.value))?.value ?? 0), 0) ?? 0;
          const yieldMult = workerMult != null ? (workerMult * (1 + traitBonus)).toFixed(2) : null;
          const speedMult = operatorMult != null ? (operatorMult * (1 + traitBonus)).toFixed(2) : null;
          const slotImageUrl = meta?.image ? getBestGatewayUrl(String(meta.image).replace('ipfs://', '')) : null;
          return (
            <EmptyVeinSlotFrame key={idx} onClick={() => setSelected(idx)} frameClassName="aspect-square">
              {!slot.nftId ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <EmptyVeinSlotPlusIcon />
                  <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                      {(slot.type as string).charAt(0).toUpperCase() + (slot.type as string).slice(1)}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Deploy {slot.collection || 'Any NFT'}</p>
                  </div>
                </div>
              ) : (
                <div className="flex w-full flex-col items-center text-center">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-200 ring-2 ring-emerald-500/30 dark:bg-zinc-800">
                    {slotImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={slotImageUrl} alt={`#${slot.nftId}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">💎</div>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">#{slot.nftId}</h3>
                  {tier && tier !== 'regular' && (
                    <span className="mt-1 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">
                      {tier}
                    </span>
                  )}
                  {yieldMult != null && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">Yield {yieldMult}×</p>
                  )}
                  {speedMult != null && (
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-500">Speed {speedMult}×</p>
                  )}
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {meta?.traits?.map((trait, i) => {
                      const bonus = getBonusForTrait(String(trait.value));
                      if (!bonus) return null;
                      return (
                        <span
                          key={i}
                          className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-400"
                        >
                          {bonus.type} +{(bonus.value * 100).toFixed(0)}%
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-500">Locked · active</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">Click to manage</p>
                </div>
              )}
            </EmptyVeinSlotFrame>
          );
        })}
      </div>

      {selected !== null ? (
        <NFTSlotSelector
          slotIndex={selected}
          slot={props.slots[selected] ?? null}
          allSlots={props.slots}
          isOpen={true}
          onClose={() => setSelected(null)}
          onDeploy={props.onDeploy}
          onRemove={() => props.onRemove(selected)}
        />
      ) : null}
    </div>
  );
}
