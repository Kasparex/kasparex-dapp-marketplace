'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { SortFilters, type SortOption } from '@/components/SortFilters';
import { DAppGrid } from '@/components/DAppGrid';
import { Footer } from '@/components/Footer';
import { placeholderDApps, filterDApps, getCategoryCounts, type FilterState } from '@/lib/dapps';
import { sortDApps } from '@/lib/sorting';
import type { Category } from '@/lib/categories';
import { categories } from '@/lib/categories';

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const validCategories = categories.map((cat) => cat.id);
  
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    categoryParam && validCategories.includes(categoryParam as Category)
      ? (categoryParam as Category)
      : 'all'
  );

  // Update category when URL param changes
  useEffect(() => {
    if (categoryParam && validCategories.includes(categoryParam as Category)) {
      setSelectedCategory(categoryParam as Category);
    }
  }, [categoryParam, validCategories]);
  const [filters, setFilters] = useState<Omit<FilterState, 'category'>>({
    status: 'all',
    developer: 'all',
    network: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Get category counts based on current filters and search
  const categoryCounts = useMemo(() => {
    return getCategoryCounts(placeholderDApps, filters, searchQuery);
  }, [filters, searchQuery]);

  // Filter and sort dApps based on current filters, selected category, search query, and sort option
  const filteredDApps = useMemo(() => {
    const filterState: FilterState = {
      category: selectedCategory,
      ...filters,
    };
    const filtered = filterDApps(placeholderDApps, filterState, searchQuery);
    return sortDApps(filtered, sortBy);
  }, [selectedCategory, filters, searchQuery, sortBy]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleFilterChange = (newFilters: Omit<FilterState, 'category'>) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setFilters({
      status: 'all',
      developer: 'all',
      network: 'all',
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
            selectedCategory={selectedCategory}
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
            selectedCategory={selectedCategory}
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
              {/* Sort Filters - Positioned absolutely in top right */}
              <div className="flex-shrink-0">
                <SortFilters sortBy={sortBy} onSortChange={setSortBy} />
              </div>
            </div>
            <DAppGrid dapps={filteredDApps} />
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
          <main className="flex-1 flex items-center justify-center">
            <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
          </main>
          <Footer />
        </div>
      }>
        <HomeContent />
      </Suspense>
    </div>
  );
}
