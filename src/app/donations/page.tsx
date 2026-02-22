'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useDonationCampaigns, type DonationCampaignListItem } from '@/hooks/useDonationCampaigns';
import { DonationsSidebar, type DonationFilterStatus } from '@/components/donations/DonationsSidebar';
import { DonationsHeader } from '@/components/donations/DonationsHeader';
import { DonationSortFilters, sortCampaigns, type DonationSortOption } from '@/components/donations/DonationSortFilters';
import { FilterBar } from '@/components/FilterBar';
import { DEFAULT_DONATION_IMAGE } from '@/lib/donations/constants';
import { formatEther } from 'viem';

export default function DonationsListingPage() {
  const { campaigns, isLoading, error } = useDonationCampaigns();
  const [selectedStatus, setSelectedStatus] = useState<DonationFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<DonationSortOption>('newest');

  const statusCounts = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    let active = 0;
    let ended = 0;
    campaigns.forEach((c) => {
      if (c.active && Number(c.deadline) > now) active++;
      else ended++;
    });
    return { all: campaigns.length, active, ended };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    let list = campaigns;
    const now = Math.floor(Date.now() / 1000);
    if (selectedStatus === 'active') {
      list = list.filter((c) => c.active && Number(c.deadline) > now);
    } else if (selectedStatus === 'ended') {
      list = list.filter((c) => !c.active || Number(c.deadline) <= now);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.creatorAddress.toLowerCase().includes(q) ||
          (c.l1Address && c.l1Address.toLowerCase().includes(q))
      );
    }
    return sortCampaigns(list, sortBy);
  }, [campaigns, selectedStatus, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="flex flex-1">
        <div className="hidden lg:block flex-shrink-0">
          <DonationsSidebar
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={handleResetFilters}
            statusCounts={statusCounts}
          />
        </div>
        <div className="lg:hidden flex-shrink-0">
          <DonationsSidebar
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetFilters={handleResetFilters}
            statusCounts={statusCounts}
          />
        </div>
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <DonationsHeader />
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Campaigns</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {isLoading ? 'Loading...' : `${filteredCampaigns.length} campaign${filteredCampaigns.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <div className="flex flex-col gap-4 mb-8">
            <FilterBar
              search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search campaigns...' }}
              onReset={handleResetFilters}
            >
              <DonationSortFilters sortBy={sortBy} onSortChange={setSortBy} />
            </FilterBar>
          </div>

          {error && (
            <div className="rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 mb-6">
              {error.message}
            </div>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 animate-pulse">
                  <div className="aspect-[16/9] bg-zinc-200 dark:bg-zinc-700" />
                  <div className="p-4">
                    <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && filteredCampaigns.length === 0 && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400">
              <p className="font-medium">No campaigns match your filters</p>
              <p className="text-sm mt-1">Try changing filters or create a campaign from the studio.</p>
              <Link
                href="/donations/studio"
                className="inline-block mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Create campaign
              </Link>
            </div>
          )}

          {!isLoading && filteredCampaigns.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((c) => (
                <DonationCampaignCard key={c.creatorAddress} campaign={c} />
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}

function DonationCampaignCard({ campaign }: { campaign: DonationCampaignListItem }) {
  const progress = campaign.targetWei > 0n ? Number((campaign.raisedWei * 10000n) / campaign.targetWei) / 100 : 0;
  const deadline = new Date(Number(campaign.deadline) * 1000);
  return (
    <Link
      href={`/donations/${campaign.creatorAddress}`}
      className="block rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
    >
      <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        <img
          src={DEFAULT_DONATION_IMAGE}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
            {campaign.creatorAddress.slice(0, 6)}...{campaign.creatorAddress.slice(-4)}
          </span>
          {campaign.active && (
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              Active
            </span>
          )}
        </div>
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {formatEther(campaign.raisedWei)} / {formatEther(campaign.targetWei)} iKAS
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-2">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {campaign.donorCount.toString()} donors · Ends {deadline.toLocaleDateString()}
        </p>
      </div>
    </Link>
  );
}
