'use client';

import { useState, useMemo, useEffect } from 'react';
import type { MiningSlot, MiningSlotType } from '@/lib/game/engine';
import { nftTabSlotDeployments, MINECORE_NFT_CREW_ROLES_ORDER, nftCrewRoleLabel } from '@/lib/game/minecore/asset-usage';
import { getBonusForTrait, getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import { WORKER_TIER_MULTIPLIERS, OPERATOR_TIER_MULTIPLIERS } from '@/lib/game/diamond-veins-config';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { GameTooltip } from '@/components/game/diamond-veins/GameTooltip';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import * as Icons from 'lucide-react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  ChroniclesNftSlotSelector,
  chroniclesNftRefToCollectionAndId,
} from '@/components/chronicles/leaderboard/ChroniclesNftSlotSelector';
import { useKasparexGlobalNftUsage } from '@/hooks/useKasparexGlobalNftUsage';
import { nftRefKey } from '@/lib/nft/kasparexMergedGlobalNftRefs';

function collectionAllowlistForMinecoreDeckSlot(slot: MiningSlot | null | undefined): string[] | undefined {
  if (!slot) return undefined;
  if (slot.type === 'worker') return ['KREXPRIME'];
  if (slot.type === 'operator' || slot.type === 'foreman') return ['PIXELKREX'];
  return undefined;
}

function minecoreDeckModalCopy(type: MiningSlotType): { title: string; description: string } {
  switch (type) {
    case 'worker':
      return {
        title: 'Worker deck slot',
        description:
          'Deploy a KREXPRIME NFT to set your base diamond mining rate. Higher rarity increases the yield multiplier.',
      };
    case 'operator':
      return {
        title: 'Operator deck slot',
        description: 'Deploy a PIXELKREX NFT to multiply mining speed. Elite tiers improve efficiency.',
      };
    case 'foreman':
      return {
        title: 'Foreman deck slot',
        description:
          'Deploy a PIXELKREX NFT as Foreman for automation perks (auto-restart when infrastructure allows). Higher rarity lifts yield lightly.',
      };
    default:
      return { title: 'NFT deck slot', description: 'Choose an NFT allowed for this role.' };
  }
}

export function WorkersPanel(props: {
  slots: MiningSlot[];
  slottedMetadata: Record<number, ParsedNFTMetadata>;
  autoRestart: boolean;
  /** True when Foreman is active or a plant has Regen Coil (automation can actually chain cycles). */
  autoRestartInfrastructureActive: boolean;
  onToggleAutoRestart: (enabled: boolean) => void;
  onDeploy: (slotIndex: number, nftId: number, collection: string) => void;
  onRemove: (slotIndex: number) => void;
  /** Paid KAS (after tier discount) to append one NFT deck slot of chosen type. */
  onPurchaseExtraSlot?: (slotType: MiningSlotType) => void | Promise<boolean>;
  slotPurchaseKas?: number;
  miningAllowed?: boolean;
}) {
  const { state: wallet } = useKaspaWallet();
  const payerKaspa = wallet.address?.trim();

  const { usageByRef, inUseRefs } = useKasparexGlobalNftUsage({
    payerKaspa,
    minecoreNftSlots: props.slots,
  });

  const [selected, setSelected] = useState<number | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyType, setBuyType] = useState<MiningSlotType>('worker');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const categoryTrailing = useMemo(() => {
    const w = nftTabSlotDeployments(props.slots, 'worker');
    const o = nftTabSlotDeployments(props.slots, 'operator');
    const f = nftTabSlotDeployments(props.slots, 'foreman');
    const fmt = (x: { filled: number; capacity: number }) => (
      <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
        {x.filled}/{x.capacity}
      </span>
    );
    return {
      Worker: fmt(w),
      Operator: fmt(o),
      Foreman: fmt(f),
    };
  }, [props.slots]);

  useEffect(() => {
    if (!buyOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setBuyOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [buyOpen]);

  const filteredSlots = useMemo(() => {
    let list = props.slots.map((s, idx) => ({ ...s, originalIndex: idx }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((slot) => {
        const meta = slot.nftId !== null ? props.slottedMetadata[slot.nftId] : null;
        return (
          slot.type.toLowerCase().includes(q) ||
          slot.nftId?.toString().includes(q) ||
          meta?.name?.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'Active') list = list.filter((s) => s.nftId !== null);
      if (statusFilter === 'Empty') list = list.filter((s) => s.nftId === null);
      if (statusFilter === 'Worker') list = list.filter((s) => s.type === 'worker');
      if (statusFilter === 'Operator') list = list.filter((s) => s.type === 'operator');
      if (statusFilter === 'Foreman') list = list.filter((s) => s.type === 'foreman');
    }

    // Recommended is original index
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.nftId ?? 0) - (b.nftId ?? 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.nftId ?? 0) - (a.nftId ?? 0));
    }

    return list;
  }, [props.slots, searchQuery, statusFilter, sortBy, props.slottedMetadata]);

  const modalSlot = selected !== null ? (props.slots[selected] ?? null) : null;
  const modalCopy = modalSlot ? minecoreDeckModalCopy(modalSlot.type) : null;
  const currentRef =
    modalSlot?.nftId != null && modalSlot.collection
      ? nftRefKey(modalSlot.collection, modalSlot.nftId)
      : null;

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
        categoryTrailing={categoryTrailing}
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
        {props.onPurchaseExtraSlot != null && props.slotPurchaseKas != null ? (
          <div className="flex aspect-square items-stretch">
            <button
              type="button"
              disabled={!props.miningAllowed}
              onClick={() => props.miningAllowed && setBuyOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 text-center transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
            >
              <EmptyVeinSlotPlusIcon />
              <div>
                <h3 className="text-base font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">Buy / Add slot</h3>
                <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {props.slotPurchaseKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Choose worker role · wallet checkout</p>
              </div>
            </button>
          </div>
        ) : null}
      </div>

      {buyOpen && props.onPurchaseExtraSlot ? (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setBuyOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Add NFT deck slot</h3>
              <button
                type="button"
                onClick={() => setBuyOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                aria-label="Close"
              >
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Slot type
            </label>
            <select
              value={buyType}
              onChange={(e) => setBuyType(e.target.value as MiningSlotType)}
              className="mb-4 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950"
            >
              {MINECORE_NFT_CREW_ROLES_ORDER.map((t) => (
                <option key={t} value={t}>
                  {nftCrewRoleLabel(t)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!props.miningAllowed}
              onClick={async () => {
                const ok = await props.onPurchaseExtraSlot!(buyType);
                if (ok) setBuyOpen(false);
              }}
              className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              Pay {props.slotPurchaseKas?.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
            </button>
          </div>
        </div>
      ) : null}

      {selected !== null && modalCopy && modalSlot ? (
        <ChroniclesNftSlotSelector
          isOpen={true}
          title={modalCopy.title}
          description={modalCopy.description}
          currentValue={currentRef}
          inUseRefs={inUseRefs}
          usageByRef={usageByRef}
          currentContext={{ entityType: 'minecore', entityId: 'workers', slotIndex: selected }}
          collectionAllowlist={collectionAllowlistForMinecoreDeckSlot(modalSlot)}
          footerNotice="Assignments save to your Minecore profile in this browser. NFTs used in Chronicles or Diamond Mining show as locked here."
          onClose={() => setSelected(null)}
          onSelect={(ref) => {
            const parsed = chroniclesNftRefToCollectionAndId(ref);
            if (!parsed) return;
            props.onDeploy(selected, parsed.tokenId, parsed.collection);
            setSelected(null);
          }}
          onRemove={() => {
            props.onRemove(selected);
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}
