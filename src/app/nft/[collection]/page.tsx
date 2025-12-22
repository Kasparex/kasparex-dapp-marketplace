'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RarityChecker } from '@/components/nft/RarityChecker';
import { TraitAnalysis } from '@/components/nft/TraitAnalysis';
import { PFPBuilder } from '@/components/nft/PFPBuilder';
import { getCollectionBySlug, isValidCollection, type CollectionConfig } from '@/lib/nft/collections';
import Link from 'next/link';

export default function CollectionPage() {
  const params = useParams();
  const collection = params?.collection as string;
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig | null>(null);

  useEffect(() => {
    if (collection && isValidCollection(collection)) {
      const config = getCollectionBySlug(collection);
      setCollectionConfig(config || null);
    }
  }, [collection]);

  if (!collection || !isValidCollection(collection) || !collectionConfig) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Collection Not Found
            </h1>
            <Link
              href="/nft"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Back to NFT Tools
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4">
                <Link
                  href="/nft"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  ← Back to NFT Tools
                </Link>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {collectionConfig.name}
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
                {collectionConfig.description || `Explore ${collectionConfig.name} collection`}
              </p>
              <a
                href={collectionConfig.kaspaComUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                View on Kaspa.com
              </a>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                  Rarity Checker
                </h2>
                <RarityChecker collectionId={collectionConfig.id} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                  Trait Analysis
                </h2>
                <TraitAnalysis collectionId={collectionConfig.id} />
              </div>
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                PFP Builder
              </h2>
              <PFPBuilder collectionId={collectionConfig.id} />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
