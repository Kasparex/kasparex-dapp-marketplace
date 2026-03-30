/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import {
  fetchNFTsByAddress,
  streamMetaJsonPathFromBaseUri,
  streamTokenBaseUri,
} from '@/lib/nft/krc721-stream-api';
import type { ParsedNFTMetadata, NFTMetadata, NFTTrait } from '@/lib/nft/metadata';
import { fetchNFTMetadata } from '@/lib/nft/metadata';
import { getCollectionById } from '@/lib/nft/collections';
import { getBestGatewayUrl, fetchJSON } from '@/lib/ipfs/gateway';
import { pointsForNftInSlot } from '@/lib/leaderboard/nftPoints';

function getNFTImageUrl(metadata: ParsedNFTMetadata | null): string | null {
  if (!metadata?.image) return null;
  const img = String(metadata.image).trim();
  if (img.startsWith('ipfs://')) {
    return getBestGatewayUrl(img.replace(/^ipfs:\/\//i, ''));
  }
  return img;
}

function parseNftRef(ref: string): { collection: string; tokenId: number } | null {
  const [collection, tokenStr] = ref.split('#');
  const tokenId = Number(tokenStr);
  if (!collection || !Number.isFinite(tokenId)) return null;
  return { collection, tokenId };
}

type SimpleNft = { collection: string; tokenId: number; buri?: string | null };

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

function useNFTMetas(nfts: SimpleNft[], isOpen: boolean) {
  const [metadataMap, setMetadataMap] = useState<Record<string, ParsedNFTMetadata>>({});

  const key = useMemo(
    () => nfts.map((n) => `${n.collection}-${n.tokenId}`).sort().join(','),
    [nfts]
  );

  useEffect(() => {
    if (nfts.length === 0) return;

    let cancelled = false;
    const load = async () => {
      const next: Record<string, ParsedNFTMetadata> = {};
      for (const nft of nfts) {
        const k = `${nft.collection}-${nft.tokenId}`;
        let parsed: ParsedNFTMetadata | null = null;

        // 1) For known/configured collections, use our proven metadata fetcher
        if (getCollectionById(nft.collection)) {
          try {
            parsed = await fetchNFTMetadata(nft.collection, nft.tokenId);
          } catch {
            /* ignore */
          }
        }

        // 2) For unknown collections, try the Stream-provided base URI (best-effort)
        if (!parsed) {
          const streamBase = (nft.buri ?? '').trim();
          const metaPath = streamBase ? streamMetaJsonPathFromBaseUri(streamBase, nft.tokenId) : null;
          if (metaPath) {
            try {
              const raw = await fetchJSON<NFTMetadata>(metaPath);
              if (raw) {
                const traits: NFTTrait[] = (raw.attributes || raw.traits || []) as NFTTrait[];
                parsed = {
                  tokenId: nft.tokenId,
                  name: raw.name ? String(raw.name) : `${nft.collection} #${nft.tokenId}`,
                  description: raw.description ? String(raw.description) : undefined,
                  image: raw.image ? String(raw.image) : undefined,
                  traits,
                  rawMetadata: raw,
                };
              }
            } catch {
              // ignore
            }
          }
        }

        if (parsed) next[k] = parsed;
      }
      if (!cancelled) setMetadataMap((prev) => ({ ...prev, ...next }));
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, key]);

  return metadataMap;
}

export function ChroniclesNftSlotSelector({
  isOpen,
  title,
  description,
  currentValue,
  inUseRefs,
  onClose,
  onSelect,
  onRemove,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  currentValue: string | null;
  inUseRefs: Set<string>;
  onClose: () => void;
  onSelect: (nftRef: string) => void;
  onRemove?: () => void;
}) {
  const { state } = useKaspaWallet();
  const payerKaspa = state.address ? normAddr(state.address) : '';
  const [rawNfts, setRawNfts] = useState<SimpleNft[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!payerKaspa) return;
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      try {
        const tokens = await fetchNFTsByAddress(payerKaspa);
        if (cancelled) return;
        const next = tokens
          .map((t) => ({
            collection: String(t.tick ?? '').toUpperCase().trim(),
            tokenId: parseInt(String(t.tokenId), 10),
            buri: streamTokenBaseUri(t),
          }))
          .filter((t) => t.collection && Number.isFinite(t.tokenId));
        setRawNfts(next);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, payerKaspa]);

  const sorted = useMemo(() => rawNfts.slice().sort((a, b) => a.collection.localeCompare(b.collection) || a.tokenId - b.tokenId), [rawNfts]);
  const metaMap = useNFTMetas(sorted, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
            {description ? <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">{description}</p> : null}
            {currentValue && onRemove ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-zinc-500 dark:text-zinc-400 truncate">Selected: {currentValue}</span>
                <button
                  type="button"
                  onClick={() => {
                    onRemove();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 border border-zinc-300 dark:border-zinc-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : null}
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
          ) : sorted.length === 0 ? (
            <div className="min-h-48 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">🛰️</div>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">No NFTs found</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Connect a wallet that can read your NFT holdings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {sorted.map((nft) => {
                const ref = `${nft.collection}#${nft.tokenId}`;
                const k = `${nft.collection}-${nft.tokenId}`;
                const meta = metaMap[k] ?? null;
                const imageUrl = getNFTImageUrl(meta);
                const scoring = pointsForNftInSlot({ collection: nft.collection, tokenId: nft.tokenId });
                const inUse = inUseRefs.has(ref) && ref !== currentValue;
                return (
                  <div
                    key={ref}
                    className={`rounded-xl border-2 overflow-hidden transition-colors ${
                      inUse
                        ? 'border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800/80 opacity-75'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-emerald-500 focus-within:border-emerald-500'
                    }`}
                  >
                    <div className="aspect-square relative bg-zinc-200 dark:bg-zinc-800">
                      {imageUrl ? (
                        <img src={imageUrl} alt={meta?.name ?? ref} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🧩</div>
                      )}
                      {inUse ? (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-bold uppercase">
                          In use
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {meta?.name ?? `${nft.collection} #${nft.tokenId}`}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        #{nft.tokenId} · {nft.collection}
                        {scoring.rarity !== 'standard' ? ` · ${scoring.rarity.toUpperCase()}` : ''} · {scoring.points} pts
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (inUse) return;
                          onSelect(ref);
                          onClose();
                        }}
                        disabled={inUse}
                        className="mt-2 w-full py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {inUse ? 'In use in another slot' : 'Insert here'}
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
            Selecting an NFT here will initiate an on-chain slot update. You can change it anytime by opening this modal again.
          </p>
        </div>
      </div>
    </div>
  );
}

export function chroniclesNftRefToCollectionAndId(ref: string): { collection: string; tokenId: number } | null {
  return parseNftRef(ref);
}

