'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sidebar } from '@/components/Sidebar';
import { PointsPageContent } from '@/components/rewards/PointsPageContent';
import type { Category } from '@/lib/categories';
import type { FilterState } from '@/lib/dapps';

export default function PointsPage() {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<Omit<FilterState, 'category'>>({
    status: [],
    developer: [],
    network: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const categoryCounts = {} as Record<Category, number>;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
          <Sidebar
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            filters={filters}
            onFilterChange={setFilters}
            categoryCounts={categoryCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={() => {
              setSelectedCategories([]);
              setFilters({ status: [], developer: [], network: [] });
              setSearchQuery('');
            }}
          />
        </div>
        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <Sidebar
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            filters={filters}
            onFilterChange={setFilters}
            categoryCounts={categoryCounts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={() => {
              setSelectedCategories([]);
              setFilters({ status: [], developer: [], network: [] });
              setSearchQuery('');
            }}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <PointsPageContent />
        </div>
      </main>
      <Footer />
    </div>
  );
}

