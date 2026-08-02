'use client';

import { useState, useMemo } from 'react';
import type { MiningSlot, MiningSlotType } from '@/lib/game/engine';
import { nftTabSlotDeployments, MINECORE_NFT_CREW_ROLES_ORDER, nftCrewRoleLabel } from '@/lib/game/minecore/asset-usage';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { EmptyVeinSlotFrame, EmptyVeinSlotPlusIcon } from '@/components/game/EmptyVeinSlotFrame';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import * as Icons from 'lucide-react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  KasparexNftSlotSelector,
  kasparexNftRefToCollectionAndId,
} from '@/components/nft/KasparexNftSlotSelector';
import { useKasparexGlobalNftUsage } from '@/hooks/useKasparexGlobalNftUsage';
import { nftRefKey } from '@/lib/nft/kasparexMergedGlobalNftRefs';
import { getMinecoreDeckCollectionAllowlist } from '@/lib/nft/minecore-deck-collections';
import { minecoreDeckBenefits } from '@/lib/game/minecore/nft-deck-benefits';
import { formatMinecoreGlobalDeckBonusLine } from '@/lib/game/minecore/nft-deck-benefits';
import { useGamesNftSlotsAdaptiveGrid } from '@/components/games/layout/GamesLayoutContext';
import { AddNftSlotModal } from '@/components/game/AddNftSlotModal';
import { nftCrewRoleBadgeClass } from '@/lib/game/nft-crew-role-styles';
import {
  MINECORE_NFT_SLOT_ROLE_BADGE,
  MINECORE_NFT_SLOT_UNLOCK_COST_KAS,
} from '@/lib/game/minecore/config';
import { GameBuySlotsButton } from '@/components/games/GameBuySlotsButton';

function collectionAllowlistForMinecoreDeckSlot(_slot: MiningSlot | null | undefined): string[] | undefined {
  return getMinecoreDeckCollectionAllowlist();
}

function minecoreDeckModalCopy(type: MiningSlotType): { title: string; description: string } {
  switch (type) {
    case 'worker':
      return {
        title: 'Worker slot',
        description:
          'Deploy a Premium or Partner NFT on this Worker row to add flat diamonds per day toward your plant rolling cap (higher tiers add more).',
      };
    case 'operator':
      return {
        title: 'Operator slot',
        description:
          'Deploy a Premium or Partner NFT on the Operator row - higher tiers add more flat diamonds per day toward your plant rolling cap.',
      };
    case 'foreman':
      return {
        title: 'Foreman slot',
        description:
          'Deploy as Foreman on the Crew tab, then bind that deck row to a plant crew slot on Mining. That unlocks AUTO on that plant when you toggle it on the Mining card.',
      };
    default:
      return { title: 'NFT slot', description: 'Choose an NFT allowed for this role.' };
  }
}

export function WorkersPanel(props: {
  slots: MiningSlot[];
  slottedMetadata: Record<number, ParsedNFTMetadata>;
  onDeploy: (slotIndex: number, nftId: number, collection: string) => void;
  onRemove: (slotIndex: number) => void;
  /** Paid KAS (after tier discount) to append one or more NFT deck slots. */
  onPurchaseExtraSlot?: (slotTypes: MiningSlotType[]) => void | Promise<boolean>;
  slotPurchaseKasByType?: Record<MiningSlotType, number>;
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

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const categoryTrailing = useMemo(() => {
    const w = nftTabSlotDeployments(props.slots, 'worker');
    const o = nftTabSlotDeployments(props.slots, 'operator');
    const f = nftTabSlotDeployments(props.slots, 'foreman');
    const fmt = (x: { filled: number; capacity: number }) => (
      <span
        className={`font-mono text-[11px] tabular-nums ${
          x.filled > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
        }`}
      >
        {x.filled}/{x.capacity}
      </span>
    );
    return {
      Worker: fmt(w),
      Operator: fmt(o),
      Foreman: fmt(f),
    };
  }, [props.slots]);

  const slotTypeOptions = useMemo(
    () =>
      MINECORE_NFT_CREW_ROLES_ORDER.map((t) => ({
        value: t,
        label: nftCrewRoleLabel(t),
        badge: `${MINECORE_NFT_SLOT_ROLE_BADGE[t]} · ${MINECORE_NFT_SLOT_UNLOCK_COST_KAS[t]} KAS`,
      })),
    [],
  );

  const buyFromKas = props.slotPurchaseKasByType?.worker ?? 0;
  const canBuySlots = props.onPurchaseExtraSlot != null && props.slotPurchaseKasByType != null;

  const globalDeckBonusLine = useMemo(
    () => formatMinecoreGlobalDeckBonusLine(props.slots, { nftMetadataByDeckIndex: props.slottedMetadata }),
    [props.slots, props.slottedMetadata],
  );

  const filteredSlots = useMemo(() => {
    let list = props.slots.map((s, idx) => ({ ...s, originalIndex: idx }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((slot) => {
        const meta = props.slottedMetadata[slot.originalIndex] ?? null;
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

    if (sortBy === 'price_asc') {
      list.sort((a, b) => (a.nftId ?? 0) - (b.nftId ?? 0));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (b.nftId ?? 0) - (a.nftId ?? 0));
    }

    return list;
  }, [props.slots, searchQuery, statusFilter, sortBy, props.slottedMetadata]);

  const slotGridClass = useGamesNftSlotsAdaptiveGrid('gap-6');

  const modalSlot = selected !== null ? (props.slots[selected] ?? null) : null;
  const modalCopy = modalSlot ? minecoreDeckModalCopy(modalSlot.type) : null;
  const currentRef =
    modalSlot?.nftId != null && modalSlot.collection
      ? nftRefKey(modalSlot.collection, modalSlot.nftId)
      : null;

  return (
    <div className="space-y-6">
      {globalDeckBonusLine ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 text-[12px] font-semibold text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {globalDeckBonusLine}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Crew slots</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Buy Worker, Operator, or Foreman deck rows, then deploy Premium or Partner NFTs. Bind Foremen to plants on
            Mining for AUTO.
          </p>
        </div>
        {canBuySlots ? (
          <GameBuySlotsButton
            disabled={!props.miningAllowed}
            onClick={() => {
              if (!props.miningAllowed) return;
              setBuyOpen(true);
            }}
          >
            Buy slots · from {buyFromKas.toLocaleString(undefined, { maximumFractionDigits: 4 })} KAS
          </GameBuySlotsButton>
        ) : null}
      </div>

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

      <div className={slotGridClass}>
        {filteredSlots.map((slot) => {
          const idx = slot.originalIndex;
          const crewSlot: MiningSlot = {
            type: slot.type,
            nftId: slot.nftId,
            collection: slot.collection,
          };
          const meta = props.slottedMetadata[idx] ?? null;
          const tier = slot.nftId !== null && slot.collection ? getNFTTier(slot.collection, slot.nftId, meta) : null;
          const slotImageUrl = meta?.image ? getBestGatewayUrl(String(meta.image).replace('ipfs://', '')) : null;
          const roleLabel = nftCrewRoleLabel(slot.type);
          const perk =
            slot.nftId != null && slot.collection ? minecoreDeckBenefits(crewSlot, meta) : { capBonus: 0, batteryMinutes: 0 };
          return (
            <EmptyVeinSlotFrame key={idx} onClick={() => setSelected(idx)} frameClassName="aspect-square">
              <div className="relative flex h-full min-h-[200px] w-full flex-col items-center justify-center pt-9">
                <span
                  className={`absolute left-4 top-3 z-[1] rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide shadow-sm ${nftCrewRoleBadgeClass(slot.type)}`}
                >
                  {roleLabel}
                </span>
                {slot.nftId != null ? (
                  <button
                    type="button"
                    className="absolute right-3 top-[2.85rem] z-[2] flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300/90 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-300"
                    aria-label="Remove NFT from this deck slot"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onRemove(idx);
                    }}
                  >
                    <Icons.X className="h-4 w-4" />
                  </button>
                ) : null}
                {!slot.nftId ? (
                  <div className="flex flex-col items-center gap-4 px-2 text-center">
                    <EmptyVeinSlotPlusIcon />
                    <div>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {slot.type === 'worker' ? 'Deploy Premium or Partner' : 'Deploy PIXELKREX'}
                      </p>
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
                    <p className="mt-1.5 max-w-[14rem] text-[11px] font-semibold leading-snug text-sky-800 dark:text-sky-300">
                      +{perk.capBonus.toLocaleString()} rolling cap D/24h
                      {slot.type === 'foreman' ? ' · auto infra when equipped' : ''}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold uppercase text-emerald-600 dark:text-emerald-500">
                      Locked · active
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">Click to manage · X clears</p>
                  </div>
                )}
              </div>
            </EmptyVeinSlotFrame>
          );
        })}
      </div>

      {canBuySlots && props.slotPurchaseKasByType && props.onPurchaseExtraSlot ? (
        <AddNftSlotModal
          open={buyOpen}
          onClose={() => setBuyOpen(false)}
          options={slotTypeOptions}
          priceByType={props.slotPurchaseKasByType}
          miningAllowed={props.miningAllowed}
          onPurchase={props.onPurchaseExtraSlot}
          description={`Select one or more roles. Worker ${MINECORE_NFT_SLOT_ROLE_BADGE.worker} (${MINECORE_NFT_SLOT_UNLOCK_COST_KAS.worker} KAS), Operator ${MINECORE_NFT_SLOT_ROLE_BADGE.operator} (${MINECORE_NFT_SLOT_UNLOCK_COST_KAS.operator} KAS), Foreman ${MINECORE_NFT_SLOT_ROLE_BADGE.foreman} (${MINECORE_NFT_SLOT_UNLOCK_COST_KAS.foreman} KAS). KREX tier discount applies at checkout.`}
        />
      ) : null}

      {selected !== null && modalCopy && modalSlot ? (
        <KasparexNftSlotSelector
          isOpen={true}
          title={modalCopy.title}
          description={modalCopy.description}
          currentValue={currentRef}
          inUseRefs={inUseRefs}
          usageByRef={usageByRef}
          currentContext={{ entityType: 'minecore', entityId: 'workers', slotIndex: selected }}
          collectionAllowlist={collectionAllowlistForMinecoreDeckSlot(modalSlot)}
          footerNotice="Assignments save to your Minecore profile in this browser. NFTs used in Diamond Veins show as locked here."
          onClose={() => setSelected(null)}
          onSelect={(ref) => {
            const parsed = kasparexNftRefToCollectionAndId(ref);
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
