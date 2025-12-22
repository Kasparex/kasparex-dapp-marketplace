'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RarityChecker } from '@/components/nft/RarityChecker';
import { TraitAnalysis } from '@/components/nft/TraitAnalysis';
import { PFPBuilder } from '@/components/nft/PFPBuilder';
import { UserNFTsTab } from '@/components/nft/UserNFTsTab';
import { collections, getAllCollectionSlugs } from '@/lib/nft/collections';
import Link from 'next/link';

type TabType = 'checker' | 'traits' | 'builder' | 'my-nfts';

export default function NFTPage() {
  const [activeTab, setActiveTab] = useState<TabType>('checker');
  const [selectedCollection, setSelectedCollection] = useState<string>('KREXPRIME');

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'checker', label: 'Rarity Checker' },
    { id: 'traits', label: 'Trait Analysis' },
    { id: 'builder', label: 'PFP Builder' },
    { id: 'my-nfts', label: 'My NFTs' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                NFT Rarity & Traits Checker
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                Explore rarity, analyze traits, and build custom PFPs for KREXPRIME and PIXELKREX collections.
              </p>

              {/* Collection Selector */}
              <div className="flex flex-wrap gap-3 mb-6">
                {Object.values(collections).map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/nft/${collection.slug}`}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCollection === collection.id
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    onClick={() => setSelectedCollection(collection.id)}
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tab Content */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === 'checker' && (
              <RarityChecker collectionId={selectedCollection} />
            )}
            {activeTab === 'traits' && (
              <TraitAnalysis collectionId={selectedCollection} />
            )}
            {activeTab === 'builder' && (
              <PFPBuilder collectionId={selectedCollection} />
            )}
            {activeTab === 'my-nfts' && (
              <UserNFTsTab />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

