'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CollectionCard } from '@/components/nft/CollectionCard';
import { NFTSidebar } from '@/components/nft/NFTSidebar';
import { UserNFTsTab } from '@/components/nft/UserNFTsTab';
import { collections } from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';

export default function NFTPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreloading, setIsPreloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'my-nfts'>('collections');

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
        {/* Main Content with Sidebar */}
        <div className="flex min-h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <NFTSidebar
            activeTab={activeTab === 'collections' ? 'collections' : 'my-nfts'}
            onTabChange={(tab) => {
              if (tab === 'my-nfts') {
                setActiveTab('my-nfts');
              } else if (tab === 'collections') {
                setActiveTab('collections');
              }
            }}
            isListingPage={true}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Content */}
          <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">
            {activeTab === 'collections' ? (
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
            ) : (
              <section className="py-8 sm:py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                    My NFTs
                  </h2>
                  <UserNFTsTab />
                </div>
              </section>
            )}
          </main>
        </div>
      </main>

      <Footer />
    </div>
  );
}

