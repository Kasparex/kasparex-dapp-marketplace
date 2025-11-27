'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PointsSidebar } from '@/components/rewards/PointsSidebar';
import { PointsPageContent } from '@/components/rewards/PointsPageContent';

export default function PointsPage() {
  const [filters, setFilters] = useState({
    unlockedPerks: true,
    lockedPerks: true,
    unlockedBadges: true,
    lockedBadges: true,
    nftPerks: true,
    nodePerks: true,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
          <PointsSidebar filters={filters} onFilterChange={setFilters} />
        </div>
        {/* Mobile sidebar */}
        <div className="lg:hidden">
          <PointsSidebar filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <PointsPageContent filters={filters} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

