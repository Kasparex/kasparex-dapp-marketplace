'use client';

import { useState, useEffect } from 'react';
import { fetchNFTMetadata, getNFTMetadata } from '@/lib/nft/metadata';
import { calculateNFTRarity, type NFTRarity } from '@/lib/nft/rarity';
import { fetchNFTRank } from '@/lib/nft/kaspa-com-api';
import { getCollectionById } from '@/lib/nft/collections';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';

interface RarityCheckerProps {
  collectionId: string;
}

export function RarityChecker({ collectionId }: RarityCheckerProps) {
  const [tokenId, setTokenId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [rarity, setRarity] = useState<NFTRarity | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const collection = getCollectionById(collectionId);

  useEffect(() => {
    // Reset state when collection changes
    setTokenId('');
    setRarity(null);
    setRank(null);
    setError(null);
    setImageUrl(null);
  }, [collectionId]);

  const handleCheckRarity = async () => {
    if (!tokenId || !collection) {
      setError('Please enter a valid token ID');
      return;
    }

    const tokenIdNum = parseInt(tokenId, 10);
    if (isNaN(tokenIdNum) || tokenIdNum < 0) {
      setError('Please enter a valid token ID number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRarity(null);
    setRank(null);
    setImageUrl(null);
    setLoadingProgress('Loading NFT metadata...');

    try {
      // Fetch metadata for the specific NFT
      const metadata = await getNFTMetadata(collectionId, tokenIdNum);
      if (!metadata) {
        setError(`NFT #${tokenIdNum} not found in ${collection.name} collection`);
        setIsLoading(false);
        return;
      }

      // Load full collection metadata for accurate rarity calculation
      setLoadingProgress('Loading collection data for rarity calculation...');
      const allMetadata = await getCollectionMetadata(collectionId);
      if (allMetadata.length === 0) {
        setError('Failed to load collection data for rarity calculation');
        setIsLoading(false);
        return;
      }

      // Calculate rarity using full collection data
      const rarityResult = calculateNFTRarity(metadata, allMetadata);
      
      // Fetch rank from KaspaCom
      const fetchedRank = await fetchNFTRank(collectionId, tokenIdNum);
      
      // Get image URL
      let imgUrl: string | null = null;
      if (metadata.image) {
        if (metadata.image.startsWith('ipfs://')) {
          const cid = metadata.image.replace('ipfs://', '');
          imgUrl = getBestGatewayUrl(cid);
        } else {
          imgUrl = metadata.image;
        }
      }

      setLoadingProgress('');
      setRarity(rarityResult);
      setRank(fetchedRank);
      setImageUrl(imgUrl);
    } catch (err) {
      console.error('Error checking rarity:', err);
      setError(err instanceof Error ? err.message : 'Failed to check rarity');
      setLoadingProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex gap-3">
        <input
          type="number"
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder={`Enter ${collection?.name || 'NFT'} token ID`}
          className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCheckRarity();
            }
          }}
        />
        <button
          onClick={handleCheckRarity}
          disabled={isLoading || !tokenId}
          className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (loadingProgress || 'Checking...') : 'Check Rarity'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Results */}
      {rarity && (
        <div className="space-y-6">
          {/* NFT Image and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {imageUrl && (
              <div className="aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={imageUrl}
                  alt={`${collection?.name} #${rarity.tokenId}`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {collection?.name} #{rarity.tokenId}
                </h3>
                {rank && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Rank: #{rank}
                  </p>
                )}
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Total Rarity Score
                </div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {rarity.totalRarityScore.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Trait Breakdown */}
          <div>
            <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Trait Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rarity.traitRarities.map((trait, index) => (
                <div
                  key={index}
                  className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                >
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    {trait.traitType}
                  </div>
                  <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    {trait.value}
                  </div>
                  <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-500">
                    <span>{trait.count} ({trait.percentage.toFixed(2)}%)</span>
                    <span className="font-medium">Score: {trait.rarityScore.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      {!rarity && !error && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Enter a token ID to check its rarity score and trait breakdown. Rarity is calculated using the standard method:
            sum of (1 / trait frequency) for each trait.
          </p>
        </div>
      )}
    </div>
  );
}

