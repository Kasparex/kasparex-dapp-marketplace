'use client';

import { useState, useEffect } from 'react';
import type { CollectionConfig } from '@/lib/nft/collections';
import { fetchCollectionByTicker, type Krc721Collection } from '@/lib/nft/kaspa-com-api';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

interface CollectionCardProps {
  collection: CollectionConfig;
  prefetched?: Krc721Collection | null;
  tierLabel?: 'Premium' | 'Partner' | 'Standard';
}

function tierBadgeClass(tier?: string) {
  if (tier === 'Premium') {
    return 'bg-lime-100 dark:bg-lime-900/30 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-700';
  }
  if (tier === 'Partner') {
    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
  }
  return 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600';
}

export function CollectionCard({ collection, prefetched, tierLabel }: CollectionCardProps) {
  const [totalSupply, setTotalSupply] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (prefetched) {
      setTotalSupply(prefetched.totalSupply || prefetched.totalMinted || 0);
      if (prefetched.image && typeof prefetched.image === 'string') {
        const imgUrl = prefetched.image.startsWith('ipfs://')
          ? getBestGatewayUrl(prefetched.image.replace('ipfs://', ''))
          : prefetched.image;
        setImageUrl(imgUrl);
      }
      setIsLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        const collectionData = await fetchCollectionByTicker(collection.id);
        if (collectionData) {
          setTotalSupply(collectionData.totalSupply || collectionData.totalMinted || 0);

          if (collectionData.image && typeof collectionData.image === 'string') {
            const imgUrl = collectionData.image.startsWith('ipfs://')
              ? getBestGatewayUrl(collectionData.image.replace('ipfs://', ''))
              : collectionData.image;
            setImageUrl(imgUrl);
          } else {
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
            } catch {
              /* preview optional */
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
  }, [collection, prefetched]);

  return (
    <KxListingCard href={`/nft/${collection.slug}`} accent="nftTools" className="flex flex-col h-full">
      <KxListingCardMedia aspectClass="aspect-square" className="border-b border-zinc-200/50 dark:border-zinc-800/50">
        {imageUrl ? (
          <img src={imageUrl} alt={collection.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
            {isLoading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-400 dark:border-zinc-600" />
            ) : (
              <svg className="w-14 h-14 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
        )}
        {tierLabel ? (
          <span
            className={`absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest backdrop-blur-sm border z-20 ${tierBadgeClass(tierLabel)}`}
          >
            {tierLabel}
          </span>
        ) : null}
      </KxListingCardMedia>

      <KxListingCardBody className="flex flex-col flex-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">{collection.name}</h3>
        {collection.description ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2 flex-1">{collection.description}</p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          {totalSupply !== null ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-500">
              <span className="font-semibold">{totalSupply.toLocaleString()}</span> NFTs
            </div>
          ) : (
            <div className="text-sm text-zinc-400 dark:text-zinc-600">Loading…</div>
          )}
          <span className="text-xs font-bold uppercase tracking-wide text-lime-700 dark:text-lime-300 group-hover:text-lime-800 dark:group-hover:text-lime-200 transition-colors">
            View →
          </span>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
