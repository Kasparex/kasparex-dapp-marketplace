'use client';

import { useState } from 'react';
import { getCollectionById } from '@/lib/nft/collections';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import type { NFTRarity } from '@/lib/nft/rarity';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCardPlaceholder } from '@/components/kx/KxListingCardPlaceholder';

interface NFTCardProps {
  tokenId: number;
  collectionId: string;
  metadata?: ParsedNFTMetadata;
  rarity?: NFTRarity;
  rank?: number | null;
  imageUrl?: string | null;
  network?: 'L1' | 'L2';
}

export function NFTCard({
  tokenId,
  collectionId,
  metadata,
  rarity,
  rank,
  imageUrl,
  network,
}: NFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const collection = getCollectionById(collectionId);
  const displayImageUrl = imageUrl || (metadata?.image?.startsWith('ipfs://')
    ? getBestGatewayUrl(metadata.image.replace('ipfs://', ''))
    : metadata?.image);

  return (
    <KxListingCard
      href={`/nft/${collection?.slug || collectionId}?tokenId=${tokenId}`}
      accent="hub"
    >
      <KxListingCardMedia aspectClass="aspect-square">
        {displayImageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-[1] bg-zinc-100 dark:bg-zinc-800">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400 dark:border-zinc-600" />
              </div>
            )}
            <img
              src={displayImageUrl}
              alt={`${collection?.name || collectionId} #${tokenId}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          </>
        ) : (
          <KxListingCardPlaceholder />
        )}
      </KxListingCardMedia>

      <KxListingCardBody>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
          {collection?.name || collectionId}
        </div>
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          #{tokenId}
        </div>

        {metadata?.name && metadata.name !== `${collection?.name} #${tokenId}` && (
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            {metadata.name}
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          {rarity && (
            <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
              Rarity: {rarity.totalRarityScore.toFixed(2)}
            </div>
          )}
          {rank && (
            <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
              Rank: #{rank}
            </div>
          )}
          {network && (
            <div className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
              {network}
            </div>
          )}
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
