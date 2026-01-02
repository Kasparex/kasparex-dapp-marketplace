'use client';

import Link from 'next/link';
import { Listing, ListingCategory } from '@/lib/listings/types';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const getCategoryColor = (category: ListingCategory) => {
    const colors: Record<ListingCategory, string> = {
      [ListingCategory.DAPPS]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      [ListingCategory.TOKENS]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      [ListingCategory.NFTS]: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      [ListingCategory.TOOLS]: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      [ListingCategory.GAMES]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      [ListingCategory.MEDIA]: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      [ListingCategory.DEFI]: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
      [ListingCategory.INFRASTRUCTURE]: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300',
    };
    return colors[category] || 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-300';
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative flex flex-col min-h-[320px]"
    >
      {/* Banner Image */}
      <div className="relative w-full h-32 bg-zinc-100/80 dark:bg-zinc-900/95 flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50">
        {listing.images.bannerCid ? (
          <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
        ) : (
          <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      <div className="p-4 relative z-10 flex flex-col flex-1 min-h-0">
        {/* Status Badge - Top Right */}
        {listing.status === 'active' && (
          <div className="absolute top-4 right-4 z-10">
            <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
              Active
            </span>
          </div>
        )}

        {/* Logo and Title */}
        <div className="mb-3 flex items-start gap-3">
          {listing.images.logoCid ? (
            <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0 pr-12">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {listing.name}
            </h3>
          </div>
        </div>

        {/* Description */}
        <div className="mb-3 flex-grow min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
            {listing.description}
          </p>
        </div>

        {/* Tags */}
        {listing.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {listing.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs font-medium rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {listing.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                +{listing.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom Section: Category and Owner */}
        <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Category Badge */}
            <div className={`px-3 py-1.5 text-sm font-medium rounded-lg ${getCategoryColor(listing.category)}`}>
              {listing.category}
            </div>
            {/* Owner Address */}
            <div className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
              {truncateAddress(listing.ownerWallet)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

