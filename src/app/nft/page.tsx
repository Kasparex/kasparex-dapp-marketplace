'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CollectionCard } from '@/components/nft/CollectionCard';
import { collections } from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';

export default function NFTPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreloading, setIsPreloading] = useState(false);

  // Filter collections based on search query
  const filteredCollections = Object.values(collections).filter((collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Preload metadata in background when page loads
  useEffect(() => {
    const preloadMetadata = async () => {
      setIsPreloading(true);
      try {
        // Preload all collections in parallel
        await Promise.allSettled(
          Object.keys(collections).map((collectionId) =>
            getCollectionMetadata(collectionId, true).catch((error) => {
              console.warn(`Failed to preload ${collectionId}:`, error);
            })
          )
        );
      } catch (error) {
        console.error('Error preloading metadata:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    // Start preloading after a short delay to not block initial render
    const timeoutId = setTimeout(preloadMetadata, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                NFT Collections
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
                Explore rarity, analyze traits, and build custom PFPs for Kasparex NFT collections.
              </p>

              {/* Search/Filter */}
              <div className="max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collections..."
                    className="w-full px-4 py-2 pl-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  />
                  <svg
                    className="absolute left-3 top-2.5 w-5 h-5 text-zinc-400 dark:text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Collections Grid */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {isPreloading && (
              <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Preloading collection data...
              </div>
            )}
            
            {filteredCollections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">
                  No collections found matching &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

