'use client';

import { use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { mockListings } from '@/lib/listings/mockData';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { resolveAsset } from '@/lib/storage/decentralized';
import { useIPFSContent } from '@/lib/ipfs/hooks';
import { ListingMetadata } from '@/lib/listings/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = use(params);
  const { state: kaspaState } = useKaspaWallet();
  
  const listing = mockListings.find(l => l.id === id);
  
  // Always call hooks unconditionally
  const { data: metadata, isLoading: isLoadingMetadata } = useIPFSContent<ListingMetadata>(
    listing?.ipfsCid || null
  );

  if (!listing) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Listing Not Found</h1>
            <Link
              href="/index"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Back to Index
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = kaspaState.address === listing.ownerWallet;

  // Resolve image URLs (in real implementation, this would use resolveAsset)
  const logoUrl = listing.images.logoCid ? `/api/ipfs?path=${listing.images.logoCid}` : null;
  const bannerUrl = listing.images.bannerCid ? `/api/ipfs?path=${listing.images.bannerCid}` : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Banner */}
        <div className="relative w-full h-64 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={listing.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-24 h-24 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex items-start gap-6 mb-8">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={listing.name}
                  className="w-24 h-24 rounded-lg border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                  <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      {listing.name}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium">
                        {listing.category}
                      </span>
                      {listing.status === 'active' && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg text-sm font-medium">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Link
                      href={`/listing/${listing.id}/edit`}
                      className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-medium"
                    >
                      Edit Listing
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Description</h2>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Tags */}
            {listing.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(listing.links.website || listing.links.twitter || listing.links.github || listing.links.discord) && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Links</h2>
                <div className="flex flex-wrap gap-3">
                  {listing.links.website && (
                    <a
                      href={listing.links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 text-sm font-medium"
                    >
                      Website
                    </a>
                  )}
                  {listing.links.twitter && (
                    <a
                      href={listing.links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                      Twitter
                    </a>
                  )}
                  {listing.links.github && (
                    <a
                      href={listing.links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-zinc-800 dark:bg-zinc-700 text-white rounded-lg hover:bg-zinc-900 dark:hover:bg-zinc-600 text-sm font-medium"
                    >
                      GitHub
                    </a>
                  )}
                  {listing.links.discord && (
                    <a
                      href={listing.links.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium"
                    >
                      Discord
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Metadata Section */}
            <div className="mb-8 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">On-Chain Verification</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Transaction Hash:</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">{listing.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">IPFS CID:</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 text-xs">{listing.ipfsCid}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Owner:</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 text-xs">{listing.ownerWallet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Created:</span>
                  <span className="text-zinc-900 dark:text-zinc-100">
                    {new Date(listing.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Back Link */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/index"
                className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                ← Back to Index
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

