'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SortFilters, type SortOption } from '@/components/SortFilters';
import { DAppGrid } from '@/components/DAppGrid';
import { Footer } from '@/components/Footer';
import { placeholderDApps, filterDApps, getCategoryCounts, type FilterState } from '@/lib/dapps';
import { sortDApps } from '@/lib/sorting';
import type { Category } from '@/lib/categories';
import { categories } from '@/lib/categories';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';

const validCategories = categories.map((cat) => cat.id);

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [displayedCount, setDisplayedCount] = useState(50);
  const { favoritesSet, toggleFavorite, isFavorite } = useFavorites();
  const { likes } = useLikes();

  // Get category counts based on current filters and search
  const categoryCounts = useMemo(() => {
    return getCategoryCounts(placeholderDApps, filters, searchQuery);
  }, [filters, searchQuery]);

  // Filter and sort dApps based on current filters, selected categories, search query, and sort option
  const filteredDApps = useMemo(() => {
    const filterState: FilterState = {
      category: selectedCategories,
      ...filters,
    };
    let filtered = filterDApps(placeholderDApps, filterState, searchQuery);
    
    // If sorting by favorites, filter to only show favorites
    if (sortBy === 'favorites') {
      filtered = filtered.filter((dapp) => favoritesSet.has(dapp.id));
    }
    
    return sortDApps(filtered, sortBy, favoritesSet, likes);
  }, [selectedCategories, filters, searchQuery, sortBy, favoritesSet, likes]);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(50);
  }, [selectedCategories, filters, searchQuery, sortBy]);

  // Get dApps to display (limited by displayedCount)
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
    setSearchQuery('');
  };

  return (
    <>
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
          <Sidebar
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            categoryCounts={categoryCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={handleResetFilters}
          />
        </div>
        {/* Mobile sidebar (fixed positioning handled in component) */}
        <div className="lg:hidden">
          <Sidebar
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            categoryCounts={categoryCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6 relative">
          <div>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Available dApps
                </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                {filteredDApps.length} dApp{filteredDApps.length !== 1 ? 's' : ''} found
              </p>
              </div>
              {/* Action Buttons and Sort Filters - Positioned in top right */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/build-dapp"
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                >
                  Build dApp
                </Link>
                <Link
                  href="/list-dapp"
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors whitespace-nowrap"
                >
                  List dApp
                </Link>
                <SortFilters 
                  sortBy={sortBy} 
                  onSortChange={setSortBy}
                  favoritesCount={favoritesSet.size}
                />
              </div>
            </div>
            <DAppGrid 
              dapps={displayedDApps}
            />
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
