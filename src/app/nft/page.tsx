'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CollectionCard } from '@/components/nft/CollectionCard';
import { NFTPageShell } from '@/components/nft/NFTPageShell';
import { UserNFTsTab } from '@/components/nft/UserNFTsTab';
import { NFTHaloHeader } from '@/components/nft/NFTHaloHeader';
import { NFTToolCard } from '@/components/nft/NFTToolCard';
import { NFTModuleCard } from '@/components/nft/NFTModuleCard';
import { FilterBar } from '@/components/FilterBar';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import {
  getNftToolsPremiumCollections,
  getPartnerCollections,
  type CollectionConfig,
} from '@/lib/nft/collections';
import { NFT_TOOLS_ROADMAP } from '@/lib/nft/nftToolsRoadmap';
import { NFT_TOOLS_MODULES } from '@/lib/nft/nftModules';
import { fetchCollectionsByTickers, type Krc721Collection } from '@/lib/nft/kaspa-com-api';
import { NFT_LISTING_TABS, NFT_LISTING_TAB_VALUES, type NftListingTab } from '@/lib/nft/listingTabs';

function collectionMatchesQuery(c: CollectionConfig, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    c.name.toLowerCase().includes(s) ||
    (c.description?.toLowerCase().includes(s) ?? false) ||
    (c.partnerName?.toLowerCase().includes(s) ?? false)
  );
}

function moduleMatchesQuery(title: string, description: string, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return title.toLowerCase().includes(s) || description.toLowerCase().includes(s);
}

function tabHeading(tab: NftListingTab): { eyebrow: string; title: string; description: string } {
  switch (tab) {
    case 'premium':
      return {
        eyebrow: 'Premium',
        title: 'Premium NFT collections',
        description:
          'Full rarity checker, trait analysis, and PFP builder. KREXPRIME and PIXELKREX are the flagship Kasparex lines with the deepest tooling.',
      };
    case 'partners':
      return {
        eyebrow: 'Partners',
        title: 'Partner collections',
        description:
          'Collaborations and ecosystem drops (e.g. KASGOTHS, KASZOMBIES) with rarity and trait tooling.',
      };
    case 'standard':
      return {
        eyebrow: 'Standard',
        title: 'Standard collections',
        description:
          'Other verified KRC-721 collections supported for wallet gallery and future cross-app perks.',
      };
    case 'modules':
      return {
        eyebrow: 'Modules',
        title: 'Collection modules',
        description:
          'Live tooling modules available on supported collections. Open a module to jump into rarity, traits, PFP, stats, or your wallet gallery.',
      };
    case 'tools':
      return {
        eyebrow: 'Tools',
        title: 'Upcoming NFT tools',
        description:
          'Planned modules, experiments, and ecosystem integrations for Kasparex NFT Tools. Timelines are indicative.',
      };
  }
}

export default function NFTPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = (() => {
    const t = searchParams.get('tab');
    return t && NFT_LISTING_TAB_VALUES.has(t) ? (t as NftListingTab) : 'premium';
  })();

  const initialView = searchParams.get('view') === 'my-nfts' ? 'my-nfts' : 'collections';

  const [pageView, setPageView] = useState<'collections' | 'my-nfts'>(initialView);
  const [listingTab, setListingTab] = useState<NftListingTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionStats, setCollectionStats] = useState<Map<string, Krc721Collection | null>>(new Map());

  const premiumList = useMemo(() => getNftToolsPremiumCollections(), []);
  const partnerList = useMemo(() => getPartnerCollections(), []);

  const filteredPremium = useMemo(
    () => premiumList.filter((c) => collectionMatchesQuery(c, searchQuery)),
    [premiumList, searchQuery],
  );
  const filteredPartner = useMemo(
    () => partnerList.filter((c) => collectionMatchesQuery(c, searchQuery)),
    [partnerList, searchQuery],
  );
  const filteredModules = useMemo(
    () => NFT_TOOLS_MODULES.filter((m) => moduleMatchesQuery(m.title, m.description, searchQuery)),
    [searchQuery],
  );
  const filteredTools = useMemo(
    () => NFT_TOOLS_ROADMAP.filter((t) => moduleMatchesQuery(t.title, t.description, searchQuery)),
    [searchQuery],
  );

  const syncUrl = useCallback(
    (view: 'collections' | 'my-nfts', tab: NftListingTab) => {
      const params = new URLSearchParams();
      if (view === 'my-nfts') {
        params.set('view', 'my-nfts');
      } else {
        params.set('tab', tab);
      }
      router.replace(`/nft?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const handleListingTabChange = (tab: NftListingTab) => {
    setPageView('collections');
    setListingTab(tab);
    syncUrl('collections', tab);
  };

  const handleResetFilters = () => setSearchQuery('');

  useEffect(() => {
    if (pageView !== 'collections') return;
    if (listingTab !== 'premium' && listingTab !== 'partners') return;
    const tickers = [...(listingTab === 'premium' ? filteredPremium : filteredPartner)].map((c) => c.id);
    if (tickers.length === 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      fetchCollectionsByTickers(tickers)
        .then((m) => {
          if (!cancelled) setCollectionStats(m);
        })
        .catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pageView, listingTab, filteredPremium, filteredPartner]);

  const heading = tabHeading(listingTab);
  const showCollectionSearch = pageView === 'collections' && (listingTab === 'premium' || listingTab === 'partners');
  const showModuleSearch = pageView === 'collections' && (listingTab === 'modules' || listingTab === 'tools');

  const resultCount =
    listingTab === 'premium'
      ? filteredPremium.length
      : listingTab === 'partners'
        ? filteredPartner.length
        : listingTab === 'modules'
          ? filteredModules.length
          : listingTab === 'tools'
            ? filteredTools.length
            : 0;

  return (
    <NFTPageShell
      sidebar={{
        activeTab: pageView === 'my-nfts' ? 'my-nfts' : 'collections',
        listingTab,
        onTabChange: (tab) => {
          if (tab === 'my-nfts') {
            setPageView('my-nfts');
            syncUrl('my-nfts', listingTab);
          } else if (tab === 'collections') {
            setPageView('collections');
            syncUrl('collections', listingTab);
          }
        },
        isListingPage: true,
        onListingTabChange: handleListingTabChange,
      }}
    >
      <NFTHaloHeader variant="hub" />

      {pageView === 'my-nfts' ? (
        <section id="nft-section-my-nfts" className="scroll-mt-24">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600 dark:text-lime-400 mb-1">Wallet</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">My NFTs</h2>
            <p className="kx-body">NFTs held by your connected Kaspa address.</p>
          </div>
          <UserNFTsTab />
        </section>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600 dark:text-lime-400 mb-1">
              {heading.eyebrow}
            </p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{heading.title}</h2>
            <p className="kx-body max-w-3xl">{heading.description}</p>
            {listingTab !== 'standard' ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                {resultCount} item{resultCount !== 1 ? 's' : ''}
                {searchQuery.trim() ? ` · matching “${searchQuery.trim()}”` : ''}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <KxTabStrip
              value={listingTab}
              onChange={handleListingTabChange}
              options={NFT_LISTING_TABS.map((t) => ({ value: t.value, label: t.label, ariaLabel: t.label }))}
              ariaLabel="Collection tier"
              scrollable
              className="max-w-full"
            />

            {(showCollectionSearch || showModuleSearch) && (
              <FilterBar
                search={{
                  value: searchQuery,
                  onChange: setSearchQuery,
                  placeholder:
                    listingTab === 'modules' || listingTab === 'tools' ? 'Search modules and tools…' : 'Search collections…',
                }}
                onReset={searchQuery ? handleResetFilters : undefined}
              />
            )}
          </div>

          {listingTab === 'premium' && (
            <section id="nft-section-premium" className="scroll-mt-24">
              {filteredPremium.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 py-8">No premium collections match your search.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPremium.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      tierLabel="Premium"
                      prefetched={collectionStats.get(collection.id) ?? undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {listingTab === 'partners' && (
            <section id="nft-section-partner" className="scroll-mt-24">
              {filteredPartner.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 py-8">No partner collections match your search.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPartner.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      tierLabel="Partner"
                      prefetched={collectionStats.get(collection.id) ?? undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {listingTab === 'standard' && (
            <section id="nft-section-standard" className="scroll-mt-24">
              <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/70 dark:bg-zinc-900/40 px-6 py-8">
                <p className="kx-body max-w-3xl">
                  Standard-tier rules follow the public points tables (base slot values for non-premium, non-partner
                  NFTs). When we onboard additional collections into this app with rarity and trait tooling, they will
                  appear in the Premium or Partners tabs by tier.
                </p>
              </div>
            </section>
          )}

          {listingTab === 'modules' && (
            <section id="nft-section-modules" className="scroll-mt-24">
              {filteredModules.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 py-8">No modules match your search.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredModules.map((module) => (
                    <NFTModuleCard key={module.id} module={module} />
                  ))}
                </div>
              )}
            </section>
          )}

          {listingTab === 'tools' && (
            <section id="nft-section-tools" className="scroll-mt-24">
              {filteredTools.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 py-8">No tools match your search.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTools.map((item) => (
                    <NFTToolCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </NFTPageShell>
  );
}
