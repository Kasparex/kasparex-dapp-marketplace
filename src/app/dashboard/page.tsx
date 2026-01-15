'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RewardsDashboardSidebar } from '@/components/rewards/RewardsDashboardSidebar';
import { RewardsDashboardContent } from '@/components/rewards/RewardsDashboardContent';

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    types: ['krex-tier', 'nft', 'node', 'premium'] as ('krex-tier' | 'nft' | 'node' | 'premium')[],
    status: ['unlocked', 'locked'] as ('unlocked' | 'locked')[],
  });
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <RewardsDashboardSidebar
            filters={filters}
            searchQuery={searchQuery}
            onFilterChange={setFilters}
            onSearchChange={setSearchQuery}
          />
        </div>
        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <RewardsDashboardSidebar
            filters={filters}
            searchQuery={searchQuery}
            onFilterChange={setFilters}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <RewardsDashboardContent
            filters={filters}
            searchQuery={searchQuery}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
