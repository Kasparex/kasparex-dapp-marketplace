'use client';

import { useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { queryUserNFTs, type UserNFT } from '@/lib/nft/nft-query';
import { getNFTMetadata } from '@/lib/nft/metadata';
import { fetchNFTRank } from '@/lib/nft/kaspa-com-api';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { collections } from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';
import { getNFTRarityCached } from '@/lib/nft/rarity-cache';

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
  const [nftDetails, setNftDetails] = useState<Map<string, {
    metadata: any;
    rarity: any;
    rank: number | null;
    imageUrl: string | null;
  }>>(new Map());

  const isWalletConnected = kaspaState.isConnected || isEVMConnected;
  const l1Address = kaspaState.address;
  const l2Address = evmAddress || null;

  const loadUserNFTs = async () => {
    if (!l1Address && !l2Address) {
      console.log('No wallet addresses available:', { l1Address, l2Address });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[UserNFTsTab] Loading NFTs for addresses:', { l1Address, l2Address, collectionId });
      const nfts = await queryUserNFTs(l1Address, l2Address, collectionId ? [collectionId] : undefined);
      console.log('[UserNFTsTab] ✓ Fetched NFTs:', nfts.length, nfts);
      setUserNFTs(nfts);
      
      if (nfts.length === 0) {
        console.warn('[UserNFTsTab] No NFTs found. Check console for NFT query logs.');
      }

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
              const rank = await fetchNFTRank(nft.collection, nft.tokenId);

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
    if (isWalletConnected && (l1Address || l2Address)) {
      loadUserNFTs();
    } else {
      setUserNFTs([]);
      setNftDetails(new Map());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWalletConnected, l1Address, l2Address]);

  const filteredNFTs = selectedCollection
    ? userNFTs.filter((nft) => nft.collection === selectedCollection)
    : userNFTs;

  const groupedByCollection = userNFTs.reduce((acc, nft) => {
    if (!acc[nft.collection]) {
      acc[nft.collection] = 0;
    }
    acc[nft.collection]++;
    return acc;
  }, {} as Record<string, number>);

  if (!isWalletConnected) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
          Connect your wallet to view your NFTs
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Supports both Kaspa L1 and Kasplex L2 wallets
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collection Filter */}
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

      {/* Empty State */}
      {!isLoading && !error && filteredNFTs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-2">
            No NFTs found
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            You don&apos;t own any NFTs from KREXPRIME or PIXELKREX collections.
          </p>
        </div>
      )}

      {/* NFT Grid */}
      {!isLoading && filteredNFTs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => {
            const key = `${nft.collection}-${nft.tokenId}`;
            const details = nftDetails.get(key);
            const collection = collections[nft.collection];

            return (
              <div
                key={key}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                  {details?.imageUrl ? (
                    <img
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
                      <div className="flex justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400">Network:</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {nft.network}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

