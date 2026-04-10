'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useDonationCampaigns } from '@/hooks/useDonationCampaigns';
import { DonationsSidebar, type DonationFilterStatus } from '@/components/donations/DonationsSidebar';
import { DonationsHeader } from '@/components/donations/DonationsHeader';
import { DonationSortFilters, sortCampaigns, type DonationSortOption } from '@/components/donations/DonationSortFilters';
import { DonationCampaignCard } from '@/components/donations/DonationCampaignCard';
import { DonationCategoryFilter, DonationNetworkFilter, DonationTagMultiFilter, type DonationNetworkFilterValue } from '@/components/donations/DonationTaxonomyFilters';
import { FilterBar } from '@/components/FilterBar';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';

export default function DonationsListingPage() {
  const { campaigns, isLoading, error } = useDonationCampaigns();
  const [selectedStatus, setSelectedStatus] = useState<DonationFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<DonationSortOption>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<DonationNetworkFilterValue>('all');
  const [metaByCreator, setMetaByCreator] = useState<Record<string, DonationCampaignMetadata | null>>({});

  const allTags = useMemo(() => {
    const set = new Set<string>();
    Object.values(metaByCreator).forEach((m) => (m?.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [metaByCreator]);

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
      list = list.filter((c) => {
        const meta = metaByCreator[c.creatorAddress];
        const title = meta?.title?.toLowerCase() ?? '';
        return (
          c.creatorAddress.toLowerCase().includes(q) ||
          (c.l1Address && c.l1Address.toLowerCase().includes(q)) ||
          title.includes(q)
        );
      });
    }
    if (selectedCategory) {
      list = list.filter((c) => (metaByCreator[c.creatorAddress]?.category ?? null) === selectedCategory);
    }
    if (selectedTags.length > 0) {
      list = list.filter((c) => {
        const tags = metaByCreator[c.creatorAddress]?.tags ?? [];
        return selectedTags.every((t) => tags.includes(t));
      });
    }
    if (selectedNetwork !== 'all') {
      // V1 campaigns are L2 escrow (Igra) today. V2 will populate L1/L2 explicitly.
      list = list.filter(() => selectedNetwork === 'l2');
    }
    return sortCampaigns(list, sortBy);
  }, [campaigns, selectedStatus, searchQuery, sortBy, selectedCategory, selectedTags, selectedNetwork, metaByCreator]);

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
    setSortBy('newest');
    setSelectedCategory(null);
    setSelectedTags([]);
    setSelectedNetwork('all');
  };

  useEffect(() => {
    let cancelled = false;
    const creatorAddresses = campaigns.map((c) => c.creatorAddress);
    const missing = creatorAddresses.filter((a) => metaByCreator[a] === undefined);
    if (missing.length === 0) return;

    missing.forEach((addr) => {
      (async () => {
        const c = campaigns.find((x) => x.creatorAddress === addr);
        if (!c?.ipfsHash) {
          if (!cancelled) setMetaByCreator((prev) => ({ ...prev, [addr]: null }));
          return;
        }
        try {
          const m = await fetchCampaignMetadata(c.ipfsHash);
          if (!cancelled) setMetaByCreator((prev) => ({ ...prev, [addr]: m ?? null }));
        } catch {
          if (!cancelled) setMetaByCreator((prev) => ({ ...prev, [addr]: null }));
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [campaigns, metaByCreator]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="flex flex-1">
        <div className="hidden lg:block flex-shrink-0">
          <DonationsSidebar
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            statusCounts={statusCounts}
          />
        </div>
        <div className="lg:hidden flex-shrink-0">
          <DonationsSidebar
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            statusCounts={statusCounts}
          />
        </div>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <DonationsHeader />
            <div id="content" className="scroll-mt-4" />
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Campaigns</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {isLoading ? 'Loading...' : `${filteredCampaigns.length} campaign${filteredCampaigns.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            <div className="flex flex-col gap-4 mb-6">
              <FilterBar
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search campaigns...' }}
                onReset={handleResetFilters}
                flexWrap={true}
              >
                <DonationNetworkFilter value={selectedNetwork} onChange={setSelectedNetwork} />
                <DonationCategoryFilter value={selectedCategory} onChange={setSelectedCategory} />
                <DonationTagMultiFilter
                  allTags={allTags}
                  selectedTags={selectedTags}
                  onToggleTag={(tag) =>
                    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                  }
                />
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
                  <DonationCampaignCard
                    key={c.creatorAddress}
                    campaign={c}
                    metadata={metaByCreator[c.creatorAddress] ?? null}
                    badges={[{ label: 'L2 • Igra', variant: 'neutral' }]}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
