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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 relative">
          <div className="max-w-7xl mx-auto">
            {/* Premium Hero */}
            <div className="relative mb-10 py-10 px-6 rounded-3xl overflow-hidden bg-zinc-950">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#02abb8,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#00c2b2,transparent_50%)]" />
              </div>
              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                  </span>
                  Ecosystem
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                  Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">dApps</span>
                </h1>
                <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
                  Discover and use decentralized applications on Kaspa. Earn GRID and XP when you interact — connect a wallet to get started.
                </p>
              </div>
            </div>

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

            {/* Controls Area */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="flex-1 min-w-[200px]">
                  <div className="k-search-container">
                    <input
                      type="text"
                      placeholder="Search dApps..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="k-search-input"
                    />
                  </div>
                </div>

                {/* Network Switcher */}
                <NetworkSwitcher
                  value={networkFilter}
                  onChange={setNetworkFilter}
                />

                {/* View Mode Switcher, Sort, Favorites, Plus */}
                <SortFilters
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  favoritesCount={favoritesSet.size}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {/* Reset Filters */}
                <button
                  onClick={handleResetFilters}
                  className="k-control-btn whitespace-nowrap"
                >
                  Reset Filters
                </button>
              </div>
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
