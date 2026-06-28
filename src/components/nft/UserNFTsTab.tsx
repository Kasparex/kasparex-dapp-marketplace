'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { useAccount } from 'wagmi';
import { queryUserNFTs, type UserNFT } from '@/lib/nft/nft-query';
import { getNFTMetadata } from '@/lib/nft/metadata';
import { fetchMultipleNFTRanks } from '@/lib/nft/kaspa-com-api';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { collections, getAllSupportedCollectionIds } from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';
import { getNFTRarityCached } from '@/lib/nft/rarity-cache';
import { isDiamondNFT as checkDiamondNFT } from '@/lib/nft/diamond-detection';
import { NFTBuyWizard } from '@/components/rewards/NFTBuyWizard';
import { NFT_MULTIPLIER, NFT_FEE_REDUCTION, DIAMOND_NFT_MULTIPLIER, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_MULTIPLIER, RAREST_NFT_FEE_REDUCTION } from '@/lib/rewards/types';
import { NFT_POINTS } from '@/lib/nft/points';
import { getChroniclesNftUsageByRef, getChroniclesStoredRarityForNftRef } from '@/lib/chronicles/leaderboard/localState';
import { pointsForNftInSlot, type NftRarity } from '@/lib/leaderboard/nftPoints';
import { LazyImg } from '@/components/ui/LazyImg';

function normKaspaAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    const t = a.trim();
    return t.startsWith('kaspa:') ? t : `kaspa:${t}`;
  }
}

interface UserNFTsTabProps {
  collectionId?: string; // Optional: filter by specific collection
}

export function UserNFTsTab({ collectionId }: UserNFTsTabProps = {}) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(collectionId || null);
  const [sortBy, setSortBy] = useState<'tokenId' | 'rarity' | 'rank' | 'collection'>('tokenId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterDiamond, setFilterDiamond] = useState(false);
  const [filterRarest, setFilterRarest] = useState(false);
  const [nftDetails, setNftDetails] = useState<Map<string, {
    metadata: any;
    rarity: any;
    rank: number | null;
    imageUrl: string | null;
  }>>(new Map());
  const [showBuyWizard, setShowBuyWizard] = useState(false);
  const [chroniclesBump, setChroniclesBump] = useState(0);
  const [visibleCount, setVisibleCount] = useState(24);

  const l1Address = kaspaState.address;
  const hasL1Wallet = Boolean(kaspaState.isConnected && l1Address);

  const payerKaspa = useMemo(() => (l1Address ? normKaspaAddr(l1Address) : ''), [l1Address]);

  useEffect(() => {
    const onLb = () => setChroniclesBump((x) => x + 1);
    window.addEventListener('chronicles-lb-local', onLb as EventListener);
    return () => window.removeEventListener('chronicles-lb-local', onLb as EventListener);
  }, []);

  const usageByRef = useMemo(() => {
    if (!payerKaspa) return {} as ReturnType<typeof getChroniclesNftUsageByRef>;
    return getChroniclesNftUsageByRef(payerKaspa);
  }, [payerKaspa, chroniclesBump]);

  function slotPointsForNft(collection: string, tokenId: number): number {
    const ref = `${collection}#${tokenId}`;
    const stored = payerKaspa ? getChroniclesStoredRarityForNftRef(payerKaspa, ref) : undefined;
    const rarity: NftRarity | undefined = stored;
    return pointsForNftInSlot({
      collection,
      tokenId,
      ...(rarity ? { rarity } : {}),
    }).points;
  }

  const loadUserNFTs = async () => {
    if (!l1Address) {
      return;
    }

    let queryAddress = l1Address;
    try {
      queryAddress = normKaspaAddr(l1Address);
    } catch {
      queryAddress = l1Address.startsWith('kaspa:') ? l1Address : `kaspa:${l1Address}`;
    }

    setIsLoading(true);
    setError(null);

    try {
      const collectionFilter = collectionId ? [collectionId] : getAllSupportedCollectionIds();
      const nfts = await queryUserNFTs(queryAddress, null, collectionFilter);
      setUserNFTs(nfts);
      setVisibleCount(24);

      // Load collection metadata for accurate rarity calculation
      const collectionMetadataMap = new Map<string, any[]>();
      const uniqueCollections = [...new Set(nfts.map((nft) => nft.collection))];
      
      for (const collectionId of uniqueCollections) {
        try {
          const metadata = await getCollectionMetadata(collectionId);
          collectionMetadataMap.set(collectionId, metadata);
        } catch (err) {
          console.warn(`Error loading collection metadata for ${collectionId}:`, err);
        }
      }

      // Batch ranks per collection to avoid N requests per NFT.
      const ranksByKey = new Map<string, number>();
      await Promise.allSettled(
        uniqueCollections.map(async (col) => {
          const tokenIds = nfts.filter((n) => n.collection === col).map((n) => n.tokenId);
          const rankMap = await fetchMultipleNFTRanks(col, tokenIds);
          rankMap.forEach((rank, tokenId) => {
            ranksByKey.set(`${col}-${tokenId}`, rank);
          });
        })
      );

      // Load details for each NFT (use cached data when available)
      const detailsMap = new Map();
      
      // Load NFTs in parallel batches for better performance
      const batchSize = 10;
      for (let i = 0; i < nfts.length; i += batchSize) {
        const batch = nfts.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map(async (nft) => {
            try {
              // Use cached metadata if available
              const metadata = await getNFTMetadata(nft.collection, nft.tokenId, true);
              if (!metadata) return;

              // Use full collection metadata for accurate rarity (cached)
              const allMetadata = collectionMetadataMap.get(nft.collection) || [];
              const rarity = allMetadata.length > 0
                ? await getNFTRarityCached(nft.collection, nft.tokenId, allMetadata)
                : null;
              const rank = ranksByKey.get(`${nft.collection}-${nft.tokenId}`) ?? null;

              let imageUrl: string | null = null;
              if (metadata.image) {
                if (metadata.image.startsWith('ipfs://')) {
                  const cid = metadata.image.replace('ipfs://', '');
                  imageUrl = getBestGatewayUrl(cid);
                } else {
                  imageUrl = metadata.image;
                }
              }

              detailsMap.set(`${nft.collection}-${nft.tokenId}`, {
                metadata,
                rarity,
                rank,
                imageUrl,
              });
            } catch (err) {
              console.warn(`Error loading details for ${nft.collection} #${nft.tokenId}:`, err);
            }
          })
        );
        // Update UI progressively
        setNftDetails(new Map(detailsMap));
      }

      setNftDetails(detailsMap);
    } catch (err) {
      console.error('Error loading user NFTs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load NFTs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasL1Wallet && l1Address) {
      loadUserNFTs();
    } else {
      setUserNFTs([]);
      setNftDetails(new Map());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasL1Wallet, l1Address, collectionId]);

  // Helper function to detect Rarest NFTs
  const isRareNFT = (collectionId: string, tokenId: number): boolean => {
    const RARE_NFT_IDS: Record<string, number[]> = {
      KREXPRIME: [345],
      PIXELKREX: [515],
    };
    const rareIds = RARE_NFT_IDS[collectionId];
    return rareIds ? rareIds.includes(tokenId) : false;
  };

  const isDiamondNFT = (nft: UserNFT, details: any): boolean => {
    return checkDiamondNFT(nft.collection, details?.metadata || null);
  };

  // Filter NFTs
  let filteredNFTs = selectedCollection
    ? userNFTs.filter((nft) => nft.collection === selectedCollection)
    : userNFTs;

  if (filterDiamond) {
    filteredNFTs = filteredNFTs.filter((nft) => {
      const key = `${nft.collection}-${nft.tokenId}`;
      const details = nftDetails.get(key);
      return isDiamondNFT(nft, details);
    });
  }

  if (filterRarest) {
    filteredNFTs = filteredNFTs.filter((nft) => isRareNFT(nft.collection, nft.tokenId));
  }

  // Sort NFTs
  filteredNFTs = [...filteredNFTs].sort((a, b) => {
    const keyA = `${a.collection}-${a.tokenId}`;
    const keyB = `${b.collection}-${b.tokenId}`;
    const detailsA = nftDetails.get(keyA);
    const detailsB = nftDetails.get(keyB);

    let comparison = 0;

    switch (sortBy) {
      case 'tokenId':
        comparison = a.tokenId - b.tokenId;
        break;
      case 'rarity':
        const rarityA = detailsA?.rarity?.totalRarityScore || 0;
        const rarityB = detailsB?.rarity?.totalRarityScore || 0;
        comparison = rarityA - rarityB;
        break;
      case 'rank':
        const rankA = detailsA?.rank || Infinity;
        const rankB = detailsB?.rank || Infinity;
        comparison = rankA - rankB;
        break;
      case 'collection':
        comparison = a.collection.localeCompare(b.collection);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const visibleNFTs = useMemo(() => filteredNFTs.slice(0, visibleCount), [filteredNFTs, visibleCount]);

  const groupedByCollection = userNFTs.reduce((acc, nft) => {
    if (!acc[nft.collection]) {
      acc[nft.collection] = 0;
    }
    acc[nft.collection]++;
    return acc;
  }, {} as Record<string, number>);

  if (!hasL1Wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
          Connect your Kaspa L1 wallet to view your NFTs
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4 max-w-md mx-auto">
          {isEVMConnected
            ? 'KRC-721 NFTs are held on Kaspa L1. Connect KasWare or Kastle to load your holdings.'
            : 'Use KasWare or Kastle from the header wallet menu.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end mb-4">
        <button
          type="button"
          onClick={loadUserNFTs}
          disabled={isLoading}
          className="k-control-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-800 dark:text-red-300 font-medium">{error}</p>
        </div>
      ) : null}

      {/* Filters and Sorting Controls */}
      {userNFTs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Collection Filter - Left Side */}
          {Object.keys(groupedByCollection).length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCollection(null)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCollection === null
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                All ({userNFTs.length})
              </button>
              {Object.entries(groupedByCollection).map(([collection, count]) => (
                <button
                  key={collection}
                  onClick={() => setSelectedCollection(collection)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCollection === collection
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {collections[collection]?.name || collection} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Filters, Sorting, and Results Count - Right Side */}
          <div className="flex flex-wrap items-center justify-end gap-3 ml-auto">
            {/* Special Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => setFilterDiamond(!filterDiamond)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                  filterDiamond
                    ? 'bg-purple-600 dark:bg-purple-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                💎 Diamond
                {(() => {
                  const collectionFiltered = selectedCollection
                    ? userNFTs.filter((nft) => nft.collection === selectedCollection)
                    : userNFTs;
                  const diamondCount = collectionFiltered.filter((nft) => {
                    const key = `${nft.collection}-${nft.tokenId}`;
                    const details = nftDetails.get(key);
                    return isDiamondNFT(nft, details);
                  }).length;
                  return diamondCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      filterDiamond ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}>
                      {diamondCount}
                    </span>
                  );
                })()}
              </button>
              <button
                onClick={() => setFilterRarest(!filterRarest)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                  filterRarest
                    ? 'bg-yellow-600 dark:bg-yellow-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                ⭐ Rarest
                {(() => {
                  const collectionFiltered = selectedCollection
                    ? userNFTs.filter((nft) => nft.collection === selectedCollection)
                    : userNFTs;
                  const rarestCount = collectionFiltered.filter((nft) => isRareNFT(nft.collection, nft.tokenId)).length;
                  return rarestCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      filterRarest ? 'bg-white/20' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {rarestCount}
                    </span>
                  );
                })()}
              </button>
            </div>

            {/* Sorting Controls */}
            <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-700 pl-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
              >
                <option value="tokenId">Token ID</option>
                <option value="rarity">Rarity</option>
                <option value="rank">Rank</option>
                <option value="collection">Collection</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Results count */}
            {(filterDiamond || filterRarest || selectedCollection) && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap border-l border-zinc-200 dark:border-zinc-700 pl-3">
                {filteredNFTs.length} / {userNFTs.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="text-zinc-600 dark:text-zinc-400">Loading your NFTs...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* NFT Rewards & Benefits Card - Show when no NFTs or always visible */}
      {userNFTs.length === 0 && !isLoading && !error && (
        <div className="mb-8 p-6 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            NFT Rewards & Benefits
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">NFT Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reward Multiplier</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee Reduction</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    🖼️ Regular NFT
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      (KREXPRIME or PIXELKREX)
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                    +{NFT_MULTIPLIER}x
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                    -{NFT_FEE_REDUCTION}%
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    {NFT_POINTS.REGULAR} point
                  </td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    💎 Diamond NFT
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      (Any Diamond from any collection)
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                    +{DIAMOND_NFT_MULTIPLIER}x
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                    -{DIAMOND_NFT_FEE_REDUCTION}%
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    {NFT_POINTS.DIAMOND} points
                  </td>
                </tr>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    ⭐ Rarest NFT
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      (#515 PIXELKREX or #345 KREXPRIME)
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                    +{RAREST_NFT_MULTIPLIER}x
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                    -{RAREST_NFT_FEE_REDUCTION}% (Zero Fee)
                  </td>
                  <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                    {NFT_POINTS.RAREST} points
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredNFTs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-2">
            No NFTs found
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6 max-w-md mx-auto">
            {collectionId
              ? `No NFTs found in ${collections[collectionId]?.name ?? collectionId} for this wallet.`
              : 'No NFTs found in supported Kasparex collections for this wallet.'}
          </p>
          <button
            onClick={() => setShowBuyWizard(true)}
            className="px-6 py-3 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
          >
            Buy or Bridge NFTs
          </button>
        </div>
      )}

      {/* NFT Grid */}
      {!isLoading && filteredNFTs.length > 0 && (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleNFTs.map((nft) => {
            const key = `${nft.collection}-${nft.tokenId}`;
            const details = nftDetails.get(key);
            const collection = collections[nft.collection];
            const nftRef = `${nft.collection}#${nft.tokenId}`;
            const slotUsages = usageByRef[nftRef] ?? [];
            const slotPts = slotPointsForNft(nft.collection, nft.tokenId);

            return (
              <div
                key={key}
                className="kx-listing-card flex flex-col h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
                data-kx-accent="nftTools"
              >
                {/* Image */}
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                  {details?.imageUrl ? (
                    <LazyImg
                      src={details.imageUrl}
                      alt={`${collection?.name} #${nft.tokenId}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                      Loading...
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    {collection?.name || nft.collection}
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    #{nft.tokenId}
                  </div>

                  {details && (
                    <div className="space-y-1 text-sm">
                      <div className="flex gap-1 mb-2">
                        {isDiamondNFT(nft, details) && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">
                            💎 Diamond
                          </span>
                        )}
                        {isRareNFT(nft.collection, nft.tokenId) && (
                          <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded">
                            ⭐ Rarest
                          </span>
                        )}
                      </div>
                      {details.rarity && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Rarity:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {details.rarity.totalRarityScore.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {details.rank && (
                        <div className="flex justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400">Rank:</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            #{details.rank}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`space-y-1 text-sm ${details ? 'mt-2' : ''}`}>
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">Network:</span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{nft.network}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-zinc-600 dark:text-zinc-400">Chronicles slot pts</span>
                        <span className="font-bold text-[#017a84] dark:text-[#8ff1f8]">{slotPts}</span>
                      </div>
                      {slotUsages.length > 0 ? (
                        <div className="text-xs space-y-1">
                          <p className="font-semibold text-emerald-700 dark:text-emerald-300">In leaderboard slot</p>
                          <ul className="space-y-1">
                            {slotUsages.map((u, i) => (
                              <li key={`${u.href}-${u.slotIndex}-${i}`}>
                                <Link href={u.href} className="text-[#02abb8] hover:underline font-medium break-all">
                                  {u.entityType} · slot {u.slotIndex}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Not placed in a Chronicles slot
                          {payerKaspa ? '' : ' (connect Kaspa wallet to detect local placements)'}
                        </p>
                      )}
                      <Link
                        href="/chronicles/leaderboard#points-table"
                        className="inline-block text-[11px] font-bold text-[#02abb8] hover:underline"
                      >
                        Points table →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {visibleCount < filteredNFTs.length ? (
          <div className="flex justify-center pt-6">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => Math.min(n + 24, filteredNFTs.length))}
              className="k-control-btn text-sm"
            >
              Load more NFTs
            </button>
          </div>
        ) : null}
        </>
      )}

      {/* Buy Wizard */}
      <NFTBuyWizard
        isOpen={showBuyWizard}
        onClose={() => setShowBuyWizard(false)}
      />
    </div>
  );
}

