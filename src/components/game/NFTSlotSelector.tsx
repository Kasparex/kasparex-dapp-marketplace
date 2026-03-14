'use client';

import { useMemo, useState, useEffect } from 'react';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getNFTTier } from '@/lib/game/diamond-bonuses';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { fetchNFTMetadata } from '@/lib/nft/metadata';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import type { UserNFT } from '@/lib/nft/nft-query';
import type { MiningSlot } from '@/hooks/useDiamondMining';

const KREXPRIME_KASPACOM = 'https://www.kaspa.com/nft/collections/KREXPRIME';
const PIXELKREX_KASPACOM = 'https://kaspa.com/nft/collections/PIXELKREX';

interface NFTSlotSelectorProps {
  slotIndex: number;
  slot: MiningSlot | null;
  allSlots: MiningSlot[];
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (slotIndex: number, nftId: number, collection: string) => void;
  onRemove?: () => void;
}

function useNFTsWithTier(
  nfts: UserNFT[],
  slot: { type: string; collection: string | null } | undefined,
  isOpen: boolean
): { nft: UserNFT; tier: 'regular' | 'diamond' | 'rarest'; metadata: ParsedNFTMetadata | null }[] {
  const [metadataMap, setMetadataMap] = useState<Record<string, ParsedNFTMetadata>>({});

  const filtered = useMemo(() => {
    if (!slot) return [];
    return nfts.filter((nft) => {
      if (slot.type === 'worker') return nft.collection === 'KREXPRIME';
      if (slot.type === 'operator') return nft.collection === 'PIXELKREX';
      return true;
    });
  }, [nfts, slot]);

  const filterKey = useMemo(
    () => filtered.map((n) => `${n.collection}-${n.tokenId}`).sort().join(','),
    [filtered]
  );

  useEffect(() => {
    if (!isOpen || filtered.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const next: Record<string, ParsedNFTMetadata> = {};
      for (const nft of filtered) {
        const key = `${nft.collection}-${nft.tokenId}`;
        if (metadataMap[key]) continue;
        try {
          const meta = await fetchNFTMetadata(nft.collection, nft.tokenId);
          if (!cancelled && meta) next[key] = meta;
        } catch {
          // ignore
        }
      }
      if (!cancelled) setMetadataMap((prev) => ({ ...prev, ...next }));
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, filterKey]);

  return useMemo(() => {
    const withTier = filtered.map((nft) => {
      const key = `${nft.collection}-${nft.tokenId}`;
      const metadata = metadataMap[key] ?? null;
      const tier = getNFTTier(nft.collection, nft.tokenId, metadata);
      return { nft, tier, metadata };
    });
    const order = { rarest: 0, diamond: 1, regular: 2 };
    withTier.sort((a, b) => {
      const diff = order[a.tier] - order[b.tier];
      if (diff !== 0) return diff;
      return a.nft.tokenId - b.nft.tokenId;
    });
    return withTier;
  }, [filtered, metadataMap]);
}

function getNFTImageUrl(metadata: ParsedNFTMetadata | null): string | null {
  if (!metadata?.image) return null;
  if (metadata.image.startsWith('ipfs://')) {
    return getBestGatewayUrl(metadata.image.replace('ipfs://', ''));
  }
  return metadata.image;
}

const SLOT_DESCRIPTIONS: Record<string, { title: string; body: string; collection: string }> = {
  worker: {
    title: 'Worker slot',
    body: 'Deploy a KREXPRIME NFT here to set your base diamond mining rate. Higher rarity (Diamond, Rarest) gives a higher yield multiplier. Click an NFT below to deploy it to this slot.',
    collection: 'KREXPRIME',
  },
  operator: {
    title: 'Operator slot',
    body: 'Deploy a PIXELKREX NFT here to multiply your mining rate. Elite Operators increase efficiency. Click an NFT below to deploy it to this slot.',
    collection: 'PIXELKREX',
  },
  booster: {
    title: 'Booster slot',
    body: 'Reserved for future partner collections. No NFT is required for now; your yield comes from the Worker and Operator slots.',
    collection: 'Any',
  },
};

export function NFTSlotSelector({ slotIndex, slot, allSlots, isOpen, onClose, onDeploy, onRemove }: NFTSlotSelectorProps) {
  const { nfts, isLoading } = useNFTStatus();
  const nftsWithTier = useNFTsWithTier(nfts, slot ?? undefined, isOpen);
  const slotInfo = slot ? SLOT_DESCRIPTIONS[slot.type] ?? null : null;
  const hasCompatibleNFTs = slot?.type === 'worker' || slot?.type === 'operator';
  const showBuyLinks = !isLoading && nftsWithTier.length === 0 && hasCompatibleNFTs;

  // Any NFT deployed in any slot (including this one) is "in use" globally until removed
  const isNFTInUseElsewhere = useMemo(() => {
    const inUse = new Set<string>();
    allSlots.forEach((s) => {
      if (s.nftId != null && s.collection) inUse.add(`${s.collection}-${s.nftId}`);
    });
    return (nft: UserNFT) => inUse.has(`${nft.collection}-${nft.tokenId}`);
  }, [allSlots]);

  if (!slot || !isOpen) return null;

  const handleDeploy = (nft: UserNFT) => {
    if (isNFTInUseElsewhere(nft)) return;
    onDeploy(slotIndex, nft.tokenId, nft.collection);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {(slot.type as string).charAt(0).toUpperCase() + (slot.type as string).slice(1)} slot
            </h2>
            {slotInfo && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg">
                {slotInfo.body}
              </p>
            )}
            {slot.nftId != null && onRemove && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">NFT #{slot.nftId} deployed.</span>
                <button
                  type="button"
                  onClick={() => { onRemove(); onClose(); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 border border-zinc-300 dark:border-zinc-600 transition-colors"
                >
                  Remove from slot
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="h-48 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading your NFTs…</p>
            </div>
          ) : nftsWithTier.length === 0 ? (
            <div className="min-h-48 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">🛰️</div>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">No compatible NFTs found</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You need {slotInfo?.collection ?? slot.collection ?? 'the right'} NFTs in your wallet for this slot.
              </p>
              {showBuyLinks && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {slot?.type === 'worker' && (
                    <a
                      href={KREXPRIME_KASPACOM}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                    >
                      Buy KREXPRIME on KaspaCom
                    </a>
                  )}
                  {slot?.type === 'operator' && (
                    <a
                      href={PIXELKREX_KASPACOM}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                    >
                      Buy PIXELKREX on KaspaCom
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {nftsWithTier.map(({ nft, tier, metadata }) => {
                const imageUrl = getNFTImageUrl(metadata);
                const inUse = isNFTInUseElsewhere(nft);
                return (
                  <div
                    key={`${nft.collection}-${nft.tokenId}`}
                    className={`rounded-xl border-2 overflow-hidden transition-colors ${
                      inUse ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800/80 opacity-75' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-emerald-500 focus-within:border-emerald-500'
                    }`}
                  >
                    <div className="aspect-square relative bg-zinc-200 dark:bg-zinc-800">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${nft.collection} #${nft.tokenId}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🤖</div>
                      )}
                      {tier !== 'regular' && (
                        <span
                          className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-semibold ${
                            tier === 'rarest' ? 'bg-amber-500/90 text-white' : 'bg-emerald-500/90 text-white'
                          }`}
                        >
                          {tier}
                        </span>
                      )}
                      {inUse && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-bold uppercase">
                          In use
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {metadata?.name ?? `${nft.collection} #${nft.tokenId}`}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">#{nft.tokenId}</p>
                      <button
                        type="button"
                        onClick={() => handleDeploy(nft)}
                        disabled={inUse}
                        className="mt-2 w-full py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {inUse ? 'In use in another slot' : 'Deploy here'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Deploying an NFT to a slot does not require a chain transaction. You can change it anytime by opening this modal again and choosing another NFT.
          </p>
        </div>
      </div>
    </div>
  );
}
