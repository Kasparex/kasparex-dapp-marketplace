'use client';

import { useState, useEffect } from 'react';
import type { CollectionConfig } from '@/lib/nft/collections';
import { fetchCollectionByTicker } from '@/lib/nft/kaspa-com-api';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCardPlaceholderIcon } from '@/components/kx/KxListingCardPlaceholder';

interface CollectionCardProps {
  collection: CollectionConfig;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load collection stats
    const loadStats = async () => {
      try {
        const collectionData = await fetchCollectionByTicker(collection.id);
        if (collectionData) {
          setTotalSupply(collectionData.totalSupply || collectionData.totalMinted || 0);
          
          // Try to get collection image (if available in metadata)
          if (collectionData.image && typeof collectionData.image === 'string') {
            const imgUrl = collectionData.image.startsWith('ipfs://')
              ? getBestGatewayUrl(collectionData.image.replace('ipfs://', ''))
              : collectionData.image;
            setImageUrl(imgUrl);
          } else {
            // Try to load first NFT image as collection preview
            const firstMetadataUrl = `${collection.baseUri.replace('ipfs://', '')}/1.json`;
            try {
              const response = await fetch(`/api/ipfs?path=${encodeURIComponent(firstMetadataUrl)}`);
              if (response.ok) {
                const metadata = await response.json();
                if (metadata.image) {
                  const imgUrl = metadata.image.startsWith('ipfs://')
                    ? getBestGatewayUrl(metadata.image.replace('ipfs://', ''))
                    : metadata.image;
                  setImageUrl(imgUrl);
                }
              }
            } catch (error) {
              console.warn('Failed to load collection preview image:', error);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load collection stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [collection]);

  return (
    <KxListingCard href={`/nft/${collection.slug}`} accent="hub" className="h-full flex flex-col">
      <KxListingCardMedia aspectClass="aspect-square">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={collection.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 dark:border-zinc-600" />
            ) : (
              <KxListingCardPlaceholderIcon className="w-16 h-16" />
            )}
          </div>
        )}
      </KxListingCardMedia>

      <KxListingCardBody comfortable>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 transition-colors">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
            {collection.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          {totalSupply !== null ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-500">
              <span className="font-medium">{totalSupply.toLocaleString()}</span> NFTs
            </div>
          ) : (
            <div className="text-sm text-zinc-400 dark:text-zinc-600">
              Loading...
            </div>
          )}
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors">
            View Collection →
          </span>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}

