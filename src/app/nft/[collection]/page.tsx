'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RarityChecker } from '@/components/nft/RarityChecker';
import { TraitAnalysis } from '@/components/nft/TraitAnalysis';
import { PFPBuilder } from '@/components/nft/PFPBuilder';
import { UserNFTsTab } from '@/components/nft/UserNFTsTab';
import { CollectionStats } from '@/components/nft/CollectionStats';
import { NFTSidebar } from '@/components/nft/NFTSidebar';
import { NFTHaloHeader } from '@/components/nft/NFTHaloHeader';
import { NFTPageShell } from '@/components/nft/NFTPageShell';
import { getCollectionBySlug, isValidCollection, type CollectionConfig } from '@/lib/nft/collections';

type TabType = 'checker' | 'traits' | 'builder' | 'my-nfts' | 'stats';

const TAB_HEADINGS: Record<TabType, { eyebrow: string; title: string }> = {
  'my-nfts': { eyebrow: 'Wallet', title: 'My NFTs' },
  checker: { eyebrow: 'Module', title: 'Rarity Checker' },
  traits: { eyebrow: 'Module', title: 'Trait Analysis' },
  builder: { eyebrow: 'Module', title: 'PFP Builder' },
  stats: { eyebrow: 'Module', title: 'Collection Statistics' },
};

export default function CollectionPage() {
  const params = useParams();
  const collection = params?.collection as string;
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('my-nfts');

  useEffect(() => {
    if (collection && isValidCollection(collection)) {
      const config = getCollectionBySlug(collection);
      setCollectionConfig(config || null);
    }
  }, [collection]);

  if (!collection || !isValidCollection(collection) || !collectionConfig) {
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Collection Not Found</h1>
            <Link href="/nft" className="k-control-btn inline-flex">
              ← Back to NFT Tools
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const heading = TAB_HEADINGS[activeTab];

  return (
    <NFTPageShell
      sidebar={{
        activeTab,
        onTabChange: (tab) => {
          if (tab !== 'collections') {
            setActiveTab(tab);
          }
        },
        collectionSlug: collection,
      }}
    >
      <NFTHaloHeader
        variant="collection"
        collectionName={collectionConfig.name}
        collectionDescription={
          collectionConfig.description || `Explore ${collectionConfig.name} in Kasparex NFT Tools.`
        }
      />

      <section className="scroll-mt-24">
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600 dark:text-lime-400 mb-1">
            {heading.eyebrow}
          </p>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{heading.title}</h2>
        </div>

        {activeTab === 'checker' && <RarityChecker collectionId={collectionConfig.id} />}
        {activeTab === 'traits' && <TraitAnalysis collectionId={collectionConfig.id} />}
        {activeTab === 'builder' && <PFPBuilder collectionId={collectionConfig.id} />}
        {activeTab === 'my-nfts' && <UserNFTsTab collectionId={collectionConfig.id} />}
        {activeTab === 'stats' && <CollectionStats collectionId={collectionConfig.id} />}
      </section>
    </NFTPageShell>
  );
}
