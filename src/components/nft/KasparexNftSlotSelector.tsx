'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { queryL1NFTs } from '@/lib/nft/nft-query';
import { streamMetaJsonPathFromBaseUri } from '@/lib/nft/krc721-stream-api';
import type { ParsedNFTMetadata, NFTMetadata, NFTTrait } from '@/lib/nft/metadata';
import { fetchNFTMetadata } from '@/lib/nft/metadata';
import { getCollectionById } from '@/lib/nft/collections';
import { getBestGatewayUrl, fetchJSON } from '@/lib/ipfs/gateway';
import { classifyNftSlotRarity, type NftSlotRarity } from '@/lib/nft/nft-slot-rarity';
import { normalizeNftRef } from '@/lib/nft/kasparexMergedGlobalNftRefs';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { LazyImg } from '@/components/ui/LazyImg';
import { X } from 'lucide-react';

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
const KREXPRIME_KASPACOM = 'https://www.kaspa.com/nft/collections/KREXPRIME';
const PIXELKREX_KASPACOM = 'https://kaspa.com/nft/collections/PIXELKREX';
type NftFilterTier = 'all' | 'diamond' | 'rarest' | 'partner-rare';
type NftSortMode = 'default' | 'token-desc' | 'token-asc';

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
      const tasks = nfts.map(async (nft) => {
        const k = `${nft.collection}-${nft.tokenId}`;
        if (metadataMap[k]) return { k, parsed: null as ParsedNFTMetadata | null };

        if (getCollectionById(nft.collection)) {
          try {
            const meta = await fetchNFTMetadata(nft.collection, nft.tokenId);
            return { k, parsed: meta };
          } catch {
            // ignore
          }
        }

        const streamBase = (nft.buri ?? '').trim();
        const metaPath = streamBase ? streamMetaJsonPathFromBaseUri(streamBase, nft.tokenId) : null;
        if (!metaPath) return { k, parsed: null as ParsedNFTMetadata | null };
        try {
          const raw = await fetchJSON<NFTMetadata>(metaPath);
          if (!raw) return { k, parsed: null as ParsedNFTMetadata | null };
          const traits: NFTTrait[] = (raw.attributes || raw.traits || []) as NFTTrait[];
          const parsed: ParsedNFTMetadata = {
            tokenId: nft.tokenId,
            name: raw.name ? String(raw.name) : `${nft.collection} #${nft.tokenId}`,
            description: raw.description ? String(raw.description) : undefined,
            image: raw.image ? String(raw.image) : undefined,
            traits,
            rawMetadata: raw,
          };
          return { k, parsed };
        } catch {
          return { k, parsed: null as ParsedNFTMetadata | null };
        }
      });

      const CONCURRENCY = 12;
      for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        const slice = tasks.slice(i, i + CONCURRENCY);
        const settled = await Promise.allSettled(slice);
        if (cancelled) return;
        const next: Record<string, ParsedNFTMetadata> = {};
        for (const s of settled) {
          if (s.status !== 'fulfilled') continue;
          if (!s.value.parsed) continue;
          next[s.value.k] = s.value.parsed;
        }
        if (Object.keys(next).length) {
          setMetadataMap((prev) => ({ ...prev, ...next }));
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, key]);

  return metadataMap;
}

export function KasparexNftSlotSelector({
  isOpen,
  title,
  description,
  currentValue,
  inUseRefs,
  usageByRef = {},
  currentContext,
  collectionAllowlist,
  footerNotice,
  onClose,
  onSelect,
  onRemove,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  currentValue: string | null;
  inUseRefs: Set<string>;
  usageByRef?: Record<string, Array<{ entityType: string; entityId: string; slotIndex: number; href: string; label: string }>>;
  currentContext?: { entityType: string; entityId: string; slotIndex: number };
  collectionAllowlist?: string[];
  footerNotice?: ReactNode;
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
        const userNfts = await queryL1NFTs(payerKaspa);
        if (cancelled) return;
        const next = userNfts
          .map((nft) => ({
            collection: nft.collection.toUpperCase(),
            tokenId: nft.tokenId,
            buri: nft.collectionConfig.baseUri ?? null,
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
  const stream = useMemo(() => {
    if (!collectionAllowlist?.length) return sorted;
    const allow = new Set(collectionAllowlist.map((c) => String(c).toUpperCase()));
    return sorted.filter((n) => allow.has(n.collection.toUpperCase()));
  }, [sorted, collectionAllowlist]);
  const [collectionFilter, setCollectionFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<NftFilterTier>('all');
  const [sortMode, setSortMode] = useState<NftSortMode>('default');
  const [visibleCount, setVisibleCount] = useState(36);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    setVisibleCount(36);
    setCollectionFilter('');
  }, [isOpen, payerKaspa]);
  const collectionOptions = useMemo(() => ['all', ...Array.from(new Set(stream.map((n) => n.collection)))], [stream]);
  const metaMap = useNFTMetas(stream.slice(0, visibleCount + 48), isOpen);

  const filtered = useMemo(() => {
    const base = stream.filter((nft) => {
      if (collectionFilter && nft.collection !== collectionFilter) return false;
      if (tierFilter === 'all') return true;
      const k = `${nft.collection}-${nft.tokenId}`;
      const meta = metaMap[k] ?? null;
      const rarity = classifyNftSlotRarity({ collection: nft.collection, tokenId: nft.tokenId, meta });
      if (tierFilter === 'diamond') return rarity === 'diamond';
      if (tierFilter === 'rarest') return rarity === 'rare';
      if (tierFilter === 'partner-rare') {
        const isCore = nft.collection === 'KREXPRIME' || nft.collection === 'PIXELKREX';
        return !isCore && rarity === 'rare';
      }
      return true;
    });
    if (sortMode === 'default') return base;
    const copy = base.slice();
    copy.sort((a, b) => {
      if (sortMode === 'token-desc') return b.tokenId - a.tokenId || a.collection.localeCompare(b.collection);
      return a.tokenId - b.tokenId || a.collection.localeCompare(b.collection);
    });
    return copy;
  }, [stream, collectionFilter, tierFilter, sortMode, metaMap]);

  useEffect(() => {
    setVisibleCount(36);
  }, [collectionFilter, tierFilter, sortMode]);
  const visibleNfts = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const visibleMetaMap = useNFTMetas(visibleNfts, isOpen);
  const canLoadMore = visibleCount < filtered.length;
  useEffect(() => {
    if (!canLoadMore || !loadMoreRef.current) return;
    const el = loadMoreRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) setVisibleCount((x) => Math.min(x + 24, filtered.length));
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [canLoadMore, filtered.length, visibleCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
            {description ? <p className="kx-body mt-1 max-w-2xl">{description}</p> : null}
            {currentValue && onRemove ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="kx-body truncate">Selected: {currentValue}</span>
                <button
                  type="button"
                  aria-label="Remove NFT from this slot"
                  title="Remove NFT from this slot"
                  onClick={() => {
                    onRemove();
                    onClose();
                  }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-zinc-200 text-zinc-700 transition-colors hover:bg-rose-500/20 hover:text-rose-600 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
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
              <p className="kx-body">Connect a wallet that can read your NFT holdings.</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <a
                  href={KREXPRIME_KASPACOM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                >
                  Buy KREXPRIME
                </a>
                <a
                  href={PIXELKREX_KASPACOM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                >
                  Buy PIXELKREX
                </a>
              </div>
            </div>
          ) : stream.length === 0 ? (
            <div className="min-h-48 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">🛰️</div>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">No matching NFTs for this slot</p>
              <p className="kx-body max-w-md">
                Your wallet has NFTs, but none from the collections allowed for this role.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:justify-between">
                  <ChroniclesFilterDropdown
                    ariaLabel="Filter by collection"
                    value={collectionFilter as '' | string}
                    onChange={(v) => setCollectionFilter(v as string)}
                    allLabel="All collections"
                    options={collectionOptions.filter((c) => c !== 'all').map((c) => ({ value: c, label: c }))}
                    minWidthClassName="min-w-[170px] !bg-zinc-100 dark:!bg-zinc-800/80 !border-zinc-300 dark:!border-zinc-600"
                  />
                  <ChroniclesFilterDropdown
                    ariaLabel="Filter by rarity"
                    value={tierFilter as '' | NftFilterTier}
                    onChange={(v) => setTierFilter((v || 'all') as NftFilterTier)}
                    allLabel="All rarities"
                    allValue={''}
                    options={[
                      { value: 'diamond', label: 'Diamond' },
                      { value: 'rarest', label: 'Rarest' },
                      { value: 'partner-rare', label: 'Partner rare' },
                    ]}
                    minWidthClassName="min-w-[170px] !bg-zinc-100 dark:!bg-zinc-800/80 !border-zinc-300 dark:!border-zinc-600"
                  />
                  <ChroniclesFilterDropdown
                    ariaLabel="Sort NFTs"
                    value={sortMode as '' | NftSortMode}
                    onChange={(v) => setSortMode((v || 'default') as NftSortMode)}
                    allLabel="Default sort"
                    allValue={''}
                    options={[
                      { value: 'token-desc', label: 'Token ID (high→low)' },
                      { value: 'token-asc', label: 'Token ID (low→high)' },
                    ]}
                    minWidthClassName="min-w-[180px] !bg-zinc-100 dark:!bg-zinc-800/80 !border-zinc-300 dark:!border-zinc-600"
                  />
                  <button
                    type="button"
                    className="k-control-btn !bg-zinc-100 dark:!bg-zinc-800/80 !border-zinc-300 dark:!border-zinc-600"
                    onClick={() => {
                      setCollectionFilter('');
                      setTierFilter('all');
                      setSortMode('default');
                    }}
                  >
                    Reset
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Showing {visibleNfts.length} of {filtered.length} NFTs
                </p>
              </div>
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No NFTs match current filters</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Try another collection or rarity filter.</p>
                </div>
              ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {visibleNfts.map((nft) => {
                const ref = normalizeNftRef(`${nft.collection}#${nft.tokenId}`);
                const currentNorm = currentValue ? normalizeNftRef(currentValue) : null;
                const k = `${nft.collection}-${nft.tokenId}`;
                const meta = visibleMetaMap[k] ?? null;
                const imageUrl = getNFTImageUrl(meta);
                const rarity: NftSlotRarity = classifyNftSlotRarity({ collection: nft.collection, tokenId: nft.tokenId, meta });
                const inUse = inUseRefs.has(ref) && ref !== currentNorm;
                const equippedHere = Boolean(currentNorm && ref === currentNorm);
                const rawUsage = usageByRef[ref] ?? [];
                const usage = rawUsage.filter((u) => {
                  if (!currentContext) return true;
                  return !(u.entityType === currentContext.entityType && u.entityId === currentContext.entityId && u.slotIndex === currentContext.slotIndex);
                });
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
                        <LazyImg src={imageUrl} alt={meta?.name ?? ref} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🧩</div>
                      )}
                      {equippedHere && onRemove ? (
                        <button
                          type="button"
                          aria-label="Remove NFT from this slot"
                          title="Remove from this slot"
                          className="absolute right-2 top-2 z-[3] flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300/95 bg-white/95 text-zinc-600 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-600 dark:bg-zinc-900/95 dark:text-zinc-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                            onClose();
                          }}
                        >
                          <X className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      ) : null}
                      {inUse ? (
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 px-2 text-center text-white">
                          <span className="text-xs font-bold uppercase tracking-wide">In use</span>
                          {usage[0]?.label ? (
                            <span className="text-[10px] font-medium leading-tight opacity-95">{usage[0].label}</span>
                          ) : null}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {meta?.name ?? `${nft.collection} #${nft.tokenId}`}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        #{nft.tokenId} · {nft.collection}
                        {rarity !== 'standard' ? ` · ${rarity.toUpperCase()}` : ''}
                      </p>
                      {inUse && usage.length > 0 ? (
                        <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                          <span className="font-semibold">Already slotted in:</span>{' '}
                          <a href={usage[0].href} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                            {usage[0].label}
                          </a>
                          . Remove it there first.
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          if (inUse || equippedHere) return;
                          onSelect(ref);
                          onClose();
                        }}
                        disabled={inUse || equippedHere}
                        className="mt-2 w-full py-2 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {inUse ? 'Locked · used in another slot' : equippedHere ? 'Equipped - tap ✕ above to remove' : 'Insert here'}
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
              )}
            </>
          )}
          {canLoadMore ? (
            <div ref={loadMoreRef} className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((x) => Math.min(x + 36, filtered.length))}
                className="k-control-btn text-sm"
              >
                Load more NFTs
              </button>
            </div>
          ) : null}
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 text-center">
          {footerNotice !== undefined ? (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{footerNotice}</div>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              One NFT can fill only one Hub slot at a time (all games). Already-used NFTs stay locked until removed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function kasparexNftRefToCollectionAndId(ref: string): { collection: string; tokenId: number } | null {
  return parseNftRef(normalizeNftRef(ref));
}
