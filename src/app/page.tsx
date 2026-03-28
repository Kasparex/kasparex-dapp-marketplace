'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SortFilters, type SortOption, type ViewMode } from '@/components/SortFilters';
import { DAppGrid } from '@/components/DAppGrid';
import { DAppTable } from '@/components/DAppTable';
import { DAppCompact } from '@/components/DAppCompact';
import { Footer } from '@/components/Footer';
import { placeholderDApps, filterDApps, getCategoryCounts, type FilterState, getDAppNetworkType } from '@/lib/dapps';
import { sortDApps } from '@/lib/sorting';
import type { Category } from '@/lib/categories';
import { categories } from '@/lib/categories';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { FilterBar } from '@/components/FilterBar';
import { AdSlider } from '@/components/ads/AdSlider';

const validCategories = categories.map((cat) => cat.id);

function HomeContent() {
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

  // Update category when URL param changes
  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam as Category)) {
      setSelectedCategories([categoryParam as Category]);
    } else if (!categoryParam) {
      // Reset categories if no param in URL
      setSelectedCategories([]);
    }
  }, [categoryParam]);

  const [filters, setFilters] = useState<Omit<FilterState, 'category'>>({
    status: [],
    developer: [],
    network: [],
  });
  const [networkFilter, setNetworkFilter] = useState<'all' | 'L1' | 'L2'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [displayedCount, setDisplayedCount] = useState(50);
  const { favoritesSet, toggleFavorite, isFavorite } = useFavorites();
  const { likes } = useLikes();

  // Auto-switch from favorites view if no favorites remain
  useEffect(() => {
    if (sortBy === 'favorites' && favoritesSet.size === 0) {
      setSortBy('newest');
    }
  }, [favoritesSet.size, sortBy]);

  // Auto-filter based on connected wallets
  const effectiveNetworkFilter = useMemo(() => {
    if (networkFilter !== 'all') {
      return networkFilter;
    }
    const isL1Connected = kaspaState.isConnected;
    const isL2Connected = isEVMConnected;
    if (isL1Connected && !isL2Connected) return 'L1' as const;
    if (isL2Connected && !isL1Connected) return 'L2' as const;
    return 'all' as const;
  }, [networkFilter, kaspaState.isConnected, isEVMConnected]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    let filteredForCounts = placeholderDApps;
    if (effectiveNetworkFilter !== 'all') {
      filteredForCounts = filteredForCounts.filter((dapp) => getDAppNetworkType(dapp) === effectiveNetworkFilter);
    }
    return getCategoryCounts(filteredForCounts, filters, searchQuery);
  }, [filters, searchQuery, effectiveNetworkFilter]);

  // Filter and sort dApps
  const filteredDApps = useMemo(() => {
    const filterState: FilterState = {
      category: selectedCategories,
      ...filters,
    };
    let filtered = filterDApps(placeholderDApps, filterState, searchQuery);
    if (effectiveNetworkFilter !== 'all') {
      filtered = filtered.filter((dapp) => getDAppNetworkType(dapp) === effectiveNetworkFilter);
    }
    if (sortBy === 'favorites') {
      filtered = filtered.filter((dapp) => favoritesSet.has(dapp.id));
    }
    return sortDApps(filtered, sortBy, favoritesSet, likes);
  }, [selectedCategories, filters, effectiveNetworkFilter, searchQuery, sortBy, favoritesSet, likes]);

  // Reset displayed count
  useEffect(() => {
    setDisplayedCount(50);
  }, [selectedCategories, filters, effectiveNetworkFilter, searchQuery, sortBy]);

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

  const handleFilterChange = (newFilters: Omit<FilterState, 'category'>) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setFilters({
      status: [],
      developer: [],
      network: [],
    });
    setNetworkFilter('all');
    setSearchQuery('');
  };

  return (
    <>
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
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

        {/* Mobile sidebar */}
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

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 relative">
          <div className="max-w-7xl mx-auto">
            {/* Premium Hero - dApps identity (violet/amber vs Magazines cyan/emerald) */}
            <div className="relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-violet-50/50 to-zinc-100 dark:from-zinc-950 dark:via-violet-950/30 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50">
              {/* Background orbs and shapes */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.15),transparent_70%)] rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.1),transparent_70%)] rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                <div className="absolute top-8 right-12 w-32 h-32 border border-violet-500/20 rounded-2xl rotate-12" />
                <div className="absolute bottom-12 right-1/4 w-24 h-24 border border-amber-500/15 rounded-xl -rotate-6" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                    </span>
                    Decentralized Apps
                  </div>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
                    Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-amber-600 dark:from-violet-400 dark:via-purple-400 dark:to-amber-400">dApps</span>
                  </h1>
                  <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-8">
                    Discover and use decentralized applications on Kaspa. Explore a growing ecosystem of tools, games, and services built for the future of finance.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a href="#content" className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/20 transition-all">
                      EXPLORE DAPPS
                    </a>
                  </div>
                </div>
                {/* Decorative app-style graphic + halo ad slot (right side overlay) */}
                <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative w-[280px]">
                  <div className="relative opacity-90 pointer-events-none">
                    <div className="w-48 h-56 rounded-2xl border-2 border-violet-500/30 bg-white/80 dark:bg-zinc-900/80 shadow-2xl shadow-violet-500/10 rotate-3 transform" />
                    <div className="absolute -bottom-2 -right-2 w-40 h-48 rounded-xl border-2 border-amber-500/20 bg-zinc-100/90 dark:bg-zinc-800/90 shadow-xl -rotate-6 transform" />
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

            {/* Page Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                Available dApps
              </h2>
              {!kaspaState.isConnected && !isEVMConnected ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Please connect a wallet to see available dApps
                </p>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {filteredDApps.length} dApp{filteredDApps.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>

            {/* Controls Area - single row via FilterBar */}
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

            {/* Content Display */}
            {!kaspaState.isConnected && !isEVMConnected ? (
              <div className="text-center py-12 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🔌</div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Connect a Wallet
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    Connect a Kaspa L1 wallet or an EVM L2 wallet to see and interact with dApps.
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">
                    Use the wallet button in the header to connect
                  </p>
                </div>
              </div>
            ) : (
              <>
                {viewMode === 'cards' ? (
                  <DAppGrid dapps={displayedDApps} />
                ) : viewMode === 'compact' ? (
                  <DAppCompact dapps={displayedDApps} />
                ) : (
                  <DAppTable dapps={displayedDApps} />
                )}

                {showLoadMore && hasMore && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-zinc-500 dark:text-zinc-400 mb-4">Loading dApps...</div>
              <div className="animate-pulse text-sm text-zinc-400 dark:text-zinc-500">
                Please wait
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }>
        <HomeContent />
      </Suspense>
    </div>
  );
}
