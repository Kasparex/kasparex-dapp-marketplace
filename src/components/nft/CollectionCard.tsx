'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { CollectionConfig } from '@/lib/nft/collections';
import { fetchCollectionByTicker } from '@/lib/nft/kaspa-com-api';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

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
    <Link
      href={`/nft/${collection.slug}`}
      className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] group"
    >
      {/* Image */}
      <div className="aspect-square bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={collection.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 dark:border-zinc-600" />
            ) : (
              <svg className="w-16 h-16 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
            {collection.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {totalSupply !== null ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-500">
              <span className="font-medium">{totalSupply.toLocaleString()}</span> NFTs
            </div>
          ) : (
            <div className="text-sm text-zinc-400 dark:text-zinc-600">
              Loading...
            </div>
          )}
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
            View Collection →
          </span>
        </div>
      </div>
    </Link>
  );
}

