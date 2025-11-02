'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DAppGrid } from '@/components/DAppGrid';
import { Footer } from '@/components/Footer';
import { placeholderDApps, filterDApps, getCategoryCounts, type FilterState } from '@/lib/dapps';
import type { Category } from '@/lib/categories';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [filters, setFilters] = useState<Omit<FilterState, 'category'>>({
    status: 'all',
    developer: 'all',
    network: 'all',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Get category counts based on current filters and search
  const categoryCounts = useMemo(() => {
    return getCategoryCounts(placeholderDApps, filters, searchQuery);
  }, [filters, searchQuery]);

  // Filter dApps based on current filters, selected category, and search query
  const filteredDApps = useMemo(() => {
    const filterState: FilterState = {
      category: selectedCategory,
      ...filters,
    };
    return filterDApps(placeholderDApps, filterState, searchQuery);
  }, [selectedCategory, filters, searchQuery]);

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
    <div className="flex flex-col min-h-screen">
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
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Available dApps
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                {filteredDApps.length} dApp{filteredDApps.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <DAppGrid dapps={filteredDApps} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
