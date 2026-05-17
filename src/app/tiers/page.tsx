'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TiersSidebar } from '@/components/rewards/TiersSidebar';
import { RewardsDashboardContent } from '@/components/rewards/RewardsDashboardContent';
import { TiersHeader } from '@/components/rewards/TiersHeader';

export default function TiersPage() {
  const [filters, setFilters] = useState({
    types: ['krex-tier', 'nft', 'node', 'premium'] as ('krex-tier' | 'nft' | 'node' | 'premium')[],
    status: ['unlocked', 'locked'] as ('unlocked' | 'locked')[],
  });
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="hidden shrink-0 lg:block">
          <TiersSidebar />
        </div>
        <div className="lg:hidden">
          <TiersSidebar />
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto bg-white p-4 sm:p-6 lg:bg-white lg:p-8 lg:pl-6 dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl">
            <TiersHeader />
          </div>
          <RewardsDashboardContent filters={filters} searchQuery={searchQuery} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
