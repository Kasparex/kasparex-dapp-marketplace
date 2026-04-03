'use client';

import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CollectionCard } from '@/components/nft/CollectionCard';
import { NFTSidebar } from '@/components/nft/NFTSidebar';
import { UserNFTsTab } from '@/components/nft/UserNFTsTab';
import { NFTHaloHeader } from '@/components/nft/NFTHaloHeader';
import {
  collections,
  getNftToolsPremiumCollections,
  getPartnerCollections,
  type CollectionConfig,
} from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';

function collectionMatchesQuery(c: CollectionConfig, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    c.name.toLowerCase().includes(s) ||
    (c.description?.toLowerCase().includes(s) ?? false) ||
    (c.partnerName?.toLowerCase().includes(s) ?? false)
  );
}

export default function NFTPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreloading, setIsPreloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'collections' | 'my-nfts'>('collections');

  const premiumList = useMemo(() => getNftToolsPremiumCollections(), []);
  const partnerList = useMemo(() => getPartnerCollections(), []);

  const filteredPremium = useMemo(
    () => premiumList.filter((c) => collectionMatchesQuery(c, searchQuery)),
    [premiumList, searchQuery]
  );
  const filteredPartner = useMemo(
    () => partnerList.filter((c) => collectionMatchesQuery(c, searchQuery)),
    [partnerList, searchQuery]
  );

  useEffect(() => {
    const preloadMetadata = async () => {
      setIsPreloading(true);
      try {
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

    const timeoutId = setTimeout(preloadMetadata, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        <div className="flex min-h-[calc(100vh-4rem)]">
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
            onListingSectionNavigate={(sectionId) => {
              setActiveTab('collections');
              requestAnimationFrame(() =>
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              );
            }}
          />

          <main className="flex-1 min-w-0 min-h-[calc(100vh-4rem)]">
            <NFTHaloHeader variant="hub" />

            {activeTab === 'collections' ? (
              <div className="py-8 sm:py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  {isPreloading && (
                    <div className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                      Preloading collection data…
                    </div>
                  )}

                  <div className="mb-8 max-w-xl">
                    <label htmlFor="nft-collection-search" className="sr-only">
                      Search collections
                    </label>
                    <input
                      id="nft-collection-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search collections…"
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#02abb8]/40"
                    />
                  </div>

                  <section
                    id="nft-section-premium"
                    className="mb-14 scroll-mt-24"
                    aria-labelledby="nft-premium-heading"
                  >
                    <div className="mb-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#02abb8] mb-1">Premium</p>
                      <h2 id="nft-premium-heading" className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Premium NFT collections
                      </h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-3xl">
                        Full rarity checker, trait analysis, and PFP builder. KREXPRIME and PIXELKREX are the flagship
                        Kasparex lines with the deepest tooling.
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                        {filteredPremium.length} of {premiumList.length} shown
                        {searchQuery.trim() ? ` · matching “${searchQuery.trim()}”` : ''}
                      </p>
                    </div>
                    {filteredPremium.length === 0 ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 py-8">
                        No premium collections match your search.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPremium.map((collection) => (
                          <CollectionCard key={collection.id} collection={collection} />
                        ))}
                      </div>
                    )}
                  </section>

                  <section
                    id="nft-section-partner"
                    className="mb-14 scroll-mt-24"
                    aria-labelledby="nft-partner-heading"
                  >
                    <div className="mb-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mb-1">
                        Partner
                      </p>
                      <h2 id="nft-partner-heading" className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Partner collections
                      </h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-3xl">
                        Collaborations and ecosystem drops (e.g. KASGOTHS, KASZOMBIES). They count toward partner-tier
                        leaderboard NFT slots and related perks; tooling depth may vary by collection.
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                        {filteredPartner.length} of {partnerList.length} shown
                        {searchQuery.trim() ? ` · matching “${searchQuery.trim()}”` : ''}
                      </p>
                    </div>
                    {filteredPartner.length === 0 ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 py-8">
                        No partner collections match your search.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPartner.map((collection) => (
                          <CollectionCard key={collection.id} collection={collection} />
                        ))}
                      </div>
                    )}
                  </section>

                  <section
                    id="nft-section-standard"
                    className="mb-6 scroll-mt-24"
                    aria-labelledby="nft-standard-heading"
                  >
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 mb-1">
                        Standard
                      </p>
                      <h2 id="nft-standard-heading" className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Standard collections
                      </h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-3xl">
                        Other verified KRC-721 collections can map to the standard tier for global leaderboard NFT slot
                        scoring and future cross-app perks. They are not listed as full tool targets here yet—this
                        section is informational only.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/70 dark:bg-zinc-900/40 px-6 py-8">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                        Standard-tier rules follow the public points tables (base slot values for non-premium,
                        non-partner NFTs). When we onboard additional collections into this app with rarity and trait
                        tooling, they will appear in the grids above by tier.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              <section id="nft-section-my-nfts" className="py-8 sm:py-12 scroll-mt-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">My NFTs</h2>
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
