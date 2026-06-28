'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { queryUserNFTs, type UserNFT } from '@/lib/nft/nft-query';
import { fetchMultipleNFTMetadata, type ParsedNFTMetadata } from '@/lib/nft/metadata';
import { collections, getAllSupportedCollectionIds } from '@/lib/nft/collections';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { isDiamondNFT } from '@/lib/nft/diamond-detection';
import { calculateTotalNFTPoints, NFT_POINTS } from '@/lib/nft/points';

interface CollectionStatsProps {
  collectionId?: string; // Optional: filter by specific collection
}

interface CollectionStatsData {
  totalNFTs: number;
  collections: Record<string, number>;
  rarity: {
    regular: number;
    diamond: number;
    rarest: number;
  };
  totalPoints: number;
  networkBreakdown: {
    l1: number;
    l2: number;
  };
}

const RARE_NFT_IDS = {
  KREXPRIME: [345],
  PIXELKREX: [515],
} as const;

function isRareNFT(collectionId: string, tokenId: number): boolean {
  const rareIds = RARE_NFT_IDS[collectionId as keyof typeof RARE_NFT_IDS];
  return rareIds ? (rareIds as readonly number[]).includes(tokenId) : false;
}

export function CollectionStats({ collectionId }: CollectionStatsProps) {
  const { state: kaspaState } = useKaspaWallet();
  const [stats, setStats] = useState<CollectionStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasL1Wallet = Boolean(kaspaState.isConnected && kaspaState.address);
  const l1Address = kaspaState.address;

  useEffect(() => {
    const loadStats = async () => {
      if (!hasL1Wallet || !l1Address) {
        setStats(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let queryAddress = l1Address;
        try {
          queryAddress = normalizeKaspaAddress(l1Address);
        } catch {
          queryAddress = l1Address.startsWith('kaspa:') ? l1Address : `kaspa:${l1Address}`;
        }

        const collectionFilter = collectionId ? [collectionId] : getAllSupportedCollectionIds();
        const nfts = await queryUserNFTs(queryAddress, null, collectionFilter);

        if (nfts.length === 0) {
          setStats({
            totalNFTs: 0,
            collections: {},
            rarity: { regular: 0, diamond: 0, rarest: 0 },
            totalPoints: 0,
            networkBreakdown: { l1: 0, l2: 0 },
          });
          setIsLoading(false);
          return;
        }

        // Fetch metadata for all NFTs
        const metadataMap = new Map<string, ParsedNFTMetadata>();
        const nftsByCollection = new Map<string, number[]>();

        nfts.forEach((nft) => {
          if (!nftsByCollection.has(nft.collection)) {
            nftsByCollection.set(nft.collection, []);
          }
          nftsByCollection.get(nft.collection)!.push(nft.tokenId);
        });

        // Fetch metadata for each collection
        for (const [collectionId, tokenIds] of nftsByCollection.entries()) {
          try {
            const collectionMetadata = await fetchMultipleNFTMetadata(collectionId, tokenIds);
            collectionMetadata.forEach((metadata, tokenId) => {
              metadataMap.set(`${collectionId}-${tokenId}`, metadata);
            });
          } catch (err) {
            console.warn(`Error loading metadata for ${collectionId}:`, err);
          }
        }

        // Calculate statistics
        const collectionsBreakdown: Record<string, number> = {};
        let regularCount = 0;
        let diamondCount = 0;
        let rarestCount = 0;
        const networkBreakdown = { l1: 0, l2: 0 };

        for (const nft of nfts) {
          // Collection breakdown
          collectionsBreakdown[nft.collection] = (collectionsBreakdown[nft.collection] || 0) + 1;

          // Network breakdown
          if (nft.network === 'L1') {
            networkBreakdown.l1++;
          } else if (nft.network === 'L2') {
            networkBreakdown.l2++;
          }

          // Rarity classification
          const metadataKey = `${nft.collection}-${nft.tokenId}`;
          const metadata = metadataMap.get(metadataKey) || null;

          if (isRareNFT(nft.collection, nft.tokenId)) {
            rarestCount++;
          } else if (isDiamondNFT(nft.collection, metadata)) {
            diamondCount++;
          } else {
            regularCount++;
          }
        }

        const totalPoints = calculateTotalNFTPoints(nfts, metadataMap);

        setStats({
          totalNFTs: nfts.length,
          collections: collectionsBreakdown,
          rarity: {
            regular: regularCount,
            diamond: diamondCount,
            rarest: rarestCount,
          },
          totalPoints,
          networkBreakdown,
        });
      } catch (err) {
        console.error('Error loading collection stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [hasL1Wallet, l1Address, collectionId]);

  if (!hasL1Wallet) {
    return (
      <div className="text-center py-12">
        <p className="kx-body mb-2">
          Connect your Kaspa L1 wallet to view collection statistics
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Use KasWare or Kastle from the header wallet menu
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#02abb8] mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Loading collection statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-red-600 dark:text-red-400 mb-2">Error loading statistics</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">{error}</p>
      </div>
    );
  }

  if (!stats || stats.totalNFTs === 0) {
    return (
      <div className="text-center py-12">
        <p className="kx-body mb-2">
          No NFTs found
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          You don&apos;t own any NFTs{collectionId ? ` from ${collections[collectionId]?.name || collectionId}` : ''} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="kx-body font-medium mb-2">Total NFTs</div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalNFTs}</div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="kx-body font-medium mb-2">Total Points</div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.totalPoints}</div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="kx-body font-medium mb-2">L1 NFTs</div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.networkBreakdown.l1}</div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="kx-body font-medium mb-2">L2 NFTs</div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{stats.networkBreakdown.l2}</div>
        </div>
      </div>

      {/* Collection Breakdown */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Collection Breakdown</h3>
        <div className="space-y-4">
          {Object.entries(stats.collections).map(([collectionId, count]) => {
            const collection = collections[collectionId];
            const percentage = stats.totalNFTs > 0 ? ((count / stats.totalNFTs) * 100).toFixed(1) : 0;
            return (
              <div key={collectionId}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {collection?.name || collectionId}
                  </span>
                  <span className="kx-body">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-zinc-400 dark:bg-zinc-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rarity Distribution */}
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Rarity Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🖼️</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Regular NFT</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {stats.rarity.regular}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {NFT_POINTS.REGULAR} point each
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💎</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Diamond NFT</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {stats.rarity.diamond}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {NFT_POINTS.DIAMOND} points each
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⭐</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Rarest NFT</span>
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              {stats.rarity.rarest}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {NFT_POINTS.RAREST} points each
            </div>
          </div>
        </div>
      </div>

      {/* Points Breakdown */}
      {stats.totalPoints > 0 && (
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Points Breakdown</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">Regular NFTs:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {stats.rarity.regular} × {NFT_POINTS.REGULAR} = {stats.rarity.regular * NFT_POINTS.REGULAR}
              </span>
            </div>
            {stats.rarity.diamond > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-400">Diamond NFTs:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {stats.rarity.diamond} × {NFT_POINTS.DIAMOND} = {stats.rarity.diamond * NFT_POINTS.DIAMOND}
                </span>
              </div>
            )}
            {stats.rarity.rarest > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-600 dark:text-zinc-400">Rarest NFTs:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {stats.rarity.rarest} × {NFT_POINTS.RAREST} = {stats.rarity.rarest * NFT_POINTS.RAREST}
                </span>
              </div>
            )}
            <div className="pt-2 mt-2 flex items-center justify-between font-semibold">
              <span className="text-zinc-900 dark:text-zinc-100">Total Points:</span>
              <span className="text-lg text-zinc-900 dark:text-zinc-100">{stats.totalPoints}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
