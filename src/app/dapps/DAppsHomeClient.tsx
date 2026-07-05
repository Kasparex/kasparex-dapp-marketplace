'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SortFilters, type SortOption, type ViewMode } from '@/components/SortFilters';
import { DAppGrid } from '@/components/DAppGrid';
import { DAppTable } from '@/components/DAppTable';
import { DAppCompact } from '@/components/DAppCompact';
import { Footer } from '@/components/Footer';
import { placeholderDApps, filterDApps, getCategoryCounts, type FilterState, type DAppNetworkFilter, matchesDAppNetworkFilter, isCovenantDApp, type DApp } from '@/lib/dapps';
import { sortDApps } from '@/lib/sorting';
import type { Category } from '@/lib/categories';
import { categories } from '@/lib/categories';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { DAppSourceSwitcher, type DAppSourceFilter } from '@/components/dapps/DAppSourceSwitcher';
import { useDirectoryListings } from '@/hooks/useDirectoryListings';
import { FilterBar } from '@/components/FilterBar';
import { AdSlider } from '@/components/ads/AdSlider';
import { VBlogDashboardBenefitsPanel } from '@/components/vblog/VBlogDashboardBenefitsPanel';
import { HUB_HALO_DESKTOP_ONLY, HUB_HALO_MOBILE_FALLBACK } from '@/lib/hub/haloHeaders';
import { HUB_MAIN_COLUMN, HUB_MAIN_INNER, HUB_PAGE_BG } from '@/lib/hub/hubLayout';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';

const validCategories = categories.map((cat) => cat.id);

export function DAppsHomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { isConnected: isEVMConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();

  const [selectedCategories, setSelectedCategories] = useState<Category[]>(() => {
    if (categoryParam && validCategories.includes(categoryParam as Category)) {
      return [categoryParam as Category];
    }
    return [];
  });

  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam as Category)) {
      setSelectedCategories([categoryParam as Category]);
    } else if (!categoryParam) {
      setSelectedCategories([]);
    }
  }, [categoryParam]);

  const [filters, setFilters] = useState<Omit<FilterState, 'category'>>({
    status: [],
    developer: [],
    network: [],
  });
  const [networkFilter, setNetworkFilter] = useState<DAppNetworkFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<DAppSourceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { activeDirectoryDApps } = useDirectoryListings();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [displayedCount, setDisplayedCount] = useState(50);
  const { favoritesSet } = useFavorites();
  const { likes } = useLikes();

  useEffect(() => {
    if (sortBy === 'favorites' && favoritesSet.size === 0) {
      setSortBy('newest');
    }
  }, [favoritesSet.size, sortBy]);

  const catalogDApps = useMemo((): DApp[] => {
    return [...placeholderDApps, ...activeDirectoryDApps];
  }, [activeDirectoryDApps]);

  const categoryCounts = useMemo(() => {
    return getCategoryCounts(catalogDApps, filters, searchQuery);
  }, [catalogDApps, filters, searchQuery]);

  const filteredDApps = useMemo(() => {
    const filterState: FilterState = {
      category: selectedCategories,
      ...filters,
    };
    let filtered = filterDApps(catalogDApps, filterState, searchQuery);

    if (sourceFilter === 'kasparex') {
      filtered = filtered.filter((dapp) => dapp.source !== 'directory' && !isCovenantDApp(dapp));
    } else if (sourceFilter === 'directory') {
      filtered = filtered.filter((dapp) => dapp.source === 'directory');
    } else if (sourceFilter === 'covenants') {
      filtered = filtered.filter((dapp) => isCovenantDApp(dapp));
    }

    if (networkFilter !== 'all') {
      filtered = filtered.filter((dapp) => matchesDAppNetworkFilter(dapp, networkFilter));
    }
    if (sortBy === 'favorites') {
      filtered = filtered.filter((dapp) => favoritesSet.has(dapp.id));
    }
    return sortDApps(filtered, sortBy, favoritesSet, likes);
  }, [catalogDApps, selectedCategories, filters, searchQuery, sortBy, favoritesSet, likes, networkFilter, sourceFilter]);

  useEffect(() => {
    setDisplayedCount(50);
  }, [selectedCategories, filters, searchQuery, sortBy, sourceFilter, networkFilter]);

  const displayedDApps = useMemo(() => {
    return filteredDApps.slice(0, displayedCount);
  }, [filteredDApps, displayedCount]);

  const hasMore = filteredDApps.length > displayedCount;
  const showLoadMore = filteredDApps.length >= 50;

  const handleLoadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + 50, filteredDApps.length));
  };

  const handleCategoryChange = (categories: Category[]) => {
    setSelectedCategories(categories);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setFilters({
      status: [],
      developer: [],
      network: [],
    });
    setNetworkFilter('all');
    setSourceFilter('all');
    setSearchQuery('');
  };

  return (
    <>
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar
            categories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            filters={filters}
            onStatusChange={(status) => setFilters({ ...filters, status })}
            onDeveloperChange={(developer) => setFilters({ ...filters, developer })}
            onNetworkChange={(network) => setFilters({ ...filters, network })}
            counts={categoryCounts}
            onResetFilters={handleResetFilters}
          />
        </div>

        <div className="lg:hidden">
          <Sidebar
            categories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            filters={filters}
            onStatusChange={(status) => setFilters({ ...filters, status })}
            onDeveloperChange={(developer) => setFilters({ ...filters, developer })}
            onNetworkChange={(network) => setFilters({ ...filters, network })}
            counts={categoryCounts}
            onResetFilters={handleResetFilters}
          />
        </div>

        <div className={HUB_MAIN_COLUMN}>
          <div className={HUB_MAIN_INNER}>
            <div className={`mb-6 ${HUB_HALO_MOBILE_FALLBACK}`}>
              <DAppSourceSwitcher value={sourceFilter} onChange={setSourceFilter} />
            </div>
            <div className={`relative mb-8 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50 ${HUB_HALO_DESKTOP_ONLY}`}>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)] rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.12),transparent_70%)] rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
                <div className="absolute top-8 right-12 w-32 h-32 border border-cyan-500/20 rounded-2xl rotate-12" />
                <div className="absolute bottom-12 right-1/4 w-24 h-24 border border-cyan-400/15 rounded-xl -rotate-6" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-800 dark:text-cyan-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                    </span>
                    Decentralized Apps
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
                    Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 dark:from-cyan-300 dark:via-cyan-300 dark:to-teal-300">dApps</span>
                  </h1>
                  <p className="kx-body max-w-xl leading-relaxed mb-8">
                    Discover and use decentralized applications on Kaspa. Explore a growing ecosystem of tools, games, and services built for the future of finance.
                  </p>
                  <DAppSourceSwitcher value={sourceFilter} onChange={setSourceFilter} />
                </div>
                <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px]">
                  <div className="relative opacity-90 pointer-events-none">
                    <div className="w-48 h-56 rounded-2xl border-2 border-cyan-500/30 bg-white/80 dark:bg-zinc-900/80 shadow-2xl shadow-cyan-500/10 rotate-3 transform" />
                    <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-teal-500/20 bg-zinc-100/90 dark:bg-zinc-800/90 shadow-xl -rotate-6 transform" />
                    <div className="absolute top-4 left-4 right-4 bottom-4 rounded-lg border border-zinc-300 dark:border-zinc-700/50 flex items-center justify-center">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">dApp</span>
                    </div>
                  </div>
                  <div
                    id="ad-slot-dapps-halo"
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto scroll-mt-24"
                  >
                    <AdSlider slotId="HALO_DAPPS_RIGHT" />
                  </div>
                </div>
              </div>
            </div>

            <div id="content" className="scroll-mt-4" />

            <HubListingTitleRow
              title="Available dApps"
              count={filteredDApps.length}
              countLabel="dApp"
              benefits={<VBlogDashboardBenefitsPanel variant="compact" className="w-full" />}
            />

            <div className="flex flex-col gap-4 mb-6">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search dApps...' }}
                onReset={handleResetFilters}
              >
                <NetworkSwitcher value={networkFilter} onChange={setNetworkFilter} />
                <SortFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  favoritesCount={favoritesSet.size}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </FilterBar>
            </div>

            <>
              {viewMode === 'cards' ? (
                <DAppGrid dapps={displayedDApps} selectedNetwork={networkFilter} />
              ) : viewMode === 'compact' ? (
                <DAppCompact dapps={displayedDApps} selectedNetwork={networkFilter} />
              ) : (
                <DAppTable dapps={displayedDApps} selectedNetwork={networkFilter} />
              )}

              {showLoadMore && hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
