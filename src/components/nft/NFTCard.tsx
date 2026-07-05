'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getCollectionById } from '@/lib/nft/collections';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import type { ParsedNFTMetadata } from '@/lib/nft/metadata';
import type { NFTRarity } from '@/lib/nft/rarity';

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
    <Link
      href={`/nft/${collection?.slug || collectionId}?tokenId=${tokenId}`}
      className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        {displayImageUrl && !imageError ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400 dark:border-zinc-600" />
              </div>
            )}
            <img
              src={displayImageUrl}
              alt={`${collection?.name || collectionId} #${tokenId}`}
              className={`w-full h-full max-w-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="kx-body mb-1">
          {collection?.name || collectionId}
        </div>
        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          #{tokenId}
        </div>

        {metadata?.name && metadata.name !== `${collection?.name} #${tokenId}` && (
          <div className="kx-body mb-2">
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
      </div>
    </Link>
  );
}

