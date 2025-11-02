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
  const [appliedFilters, setAppliedFilters] = useState<Omit<FilterState, 'category'>>({
    status: 'all',
    developer: 'all',
    network: 'all',
  });
  const [pendingFilters, setPendingFilters] = useState<Omit<FilterState, 'category'>>({
    status: 'all',
    developer: 'all',
    network: 'all',
  });

  // Get category counts based on applied filters
  const categoryCounts = useMemo(() => {
    return getCategoryCounts(placeholderDApps, appliedFilters);
  }, [appliedFilters]);

  // Filter dApps based on applied filters and selected category
  const filteredDApps = useMemo(() => {
    const filters: FilterState = {
      category: selectedCategory,
      ...appliedFilters,
    };
    return filterDApps(placeholderDApps, filters);
  }, [selectedCategory, appliedFilters]);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSelectedDApp(null); // Reset selected dApp when changing category
  };

  const handleFilterChange = (filters: Omit<FilterState, 'category'>) => {
    setPendingFilters(filters);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(pendingFilters);
    setSelectedDApp(null); // Reset selected dApp when applying filters
  };

  const handleResetFilters = () => {
    const resetFilters = {
      status: 'all' as const,
      developer: 'all' as const,
      network: 'all' as const,
    };
    setPendingFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setSelectedDApp(null); // Reset selected dApp when resetting filters
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
            filters={pendingFilters}
            onFilterChange={handleFilterChange}
            categoryCounts={categoryCounts}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </div>
        {/* Mobile sidebar (fixed positioning handled in component) */}
        <div className="lg:hidden">
          <Sidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            filters={pendingFilters}
            onFilterChange={handleFilterChange}
            categoryCounts={categoryCounts}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
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
