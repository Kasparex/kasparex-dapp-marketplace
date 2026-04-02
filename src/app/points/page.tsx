'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PointsSidebar } from '@/components/rewards/PointsSidebar';
import { PointsPageContent } from '@/components/rewards/PointsPageContent';
import { PointsHeader } from '@/components/rewards/PointsHeader';

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
        <div className="hidden lg:block flex-shrink-0">
          <PointsSidebar filters={filters} onFilterChange={setFilters} />
        </div>
        <div className="lg:hidden">
          <PointsSidebar filters={filters} onFilterChange={setFilters} />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto">
            <PointsHeader />
            <PointsPageContent filters={filters} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

