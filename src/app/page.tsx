'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DAppGrid } from '@/components/DAppGrid';
import { DAppDetail } from '@/components/DAppDetail';
import { Footer } from '@/components/Footer';
import { placeholderDApps, filterDApps, getCategoryCounts, type FilterState } from '@/lib/dapps';
import type { Category } from '@/lib/categories';
import type { DApp } from '@/lib/dapps';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedDApp, setSelectedDApp] = useState<DApp | null>(null);
  const [filters, setFilters] = useState<Omit<FilterState, 'category'>>({
    status: 'all',
    developer: 'all',
    network: 'all',
  });

  // Get category counts based on current filters
  const categoryCounts = useMemo(() => {
    return getCategoryCounts(placeholderDApps, filters);
  }, [filters]);

  // Filter dApps based on current filters and selected category
  const filteredDApps = useMemo(() => {
    const filterState: FilterState = {
      category: selectedCategory,
      ...filters,
    };
    return filterDApps(placeholderDApps, filterState);
  }, [selectedCategory, filters]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSelectedDApp(null); // Reset selected dApp when changing category
  };

  const handleFilterChange = (newFilters: Omit<FilterState, 'category'>) => {
    setFilters(newFilters);
    setSelectedDApp(null); // Reset selected dApp when changing filters
  };

  const handleDAppClick = (dapp: DApp) => {
    setSelectedDApp(dapp);
  };

  const handleBack = () => {
    setSelectedDApp(null);
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
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          {selectedDApp ? (
            <DAppDetail dapp={selectedDApp} onBack={handleBack} />
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Available dApps
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {filteredDApps.length} dApp{filteredDApps.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <DAppGrid dapps={filteredDApps} onDAppClick={handleDAppClick} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
