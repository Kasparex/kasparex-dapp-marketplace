'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar, type DonationFilterStatus } from '@/components/donations/DonationsSidebar';
import { FilterBar } from '@/components/FilterBar';
import { DonationSortFilters, sortCampaigns, type DonationSortOption } from '@/components/donations/DonationSortFilters';
import { DonationCampaignCard } from '@/components/donations/DonationCampaignCard';
import { CovenantCrowdfundCampaignCard } from '@/components/donations/CovenantCrowdfundCampaignCard';
import { DonationCategoryFilter, DonationTagMultiFilter } from '@/components/donations/DonationTaxonomyFilters';
import { useDonationCampaign } from '@/hooks/useDonationCampaign';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeAddr } from '@/lib/covenant/utils';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import { totalRaisedWei } from '@/lib/donations/totals';
import type { DonationCampaign } from '@/lib/donations/types';

function dashboardGoalReached(c: DonationCampaign): boolean {
  const v2 = c.campaignIdV2 != null;
  const raised = v2 ? c.raisedWei : totalRaisedWei(c);
  return raised >= c.targetWei;
}

export default function DonationsDashboardPage() {
  const { address, isConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const { campaign, isLoading, error, refetch } = useDonationCampaign(address ?? null);
  const { campaigns: covenantLinked, loading: covenantLoading } = useCovenantCrowdfund();

  const myCovenantCampaigns = useMemo(() => {
    if (!kaspaState.address) return [];
    const norm = normalizeAddr(kaspaState.address);
    return covenantLinked.filter((c) => normalizeAddr(c.creator) === norm);
  }, [covenantLinked, kaspaState.address]);

  // Keep the same filter primitives as the main listing (future-proof for multi-campaign V2).
  const [selectedStatus, setSelectedStatus] = useState<DonationFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<DonationSortOption>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<DonationCampaignMetadata | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!campaign?.ipfsHash) {
      setMetadata(null);
      return;
    }
    (async () => {
      try {
        const m = await fetchCampaignMetadata(campaign.ipfsHash);
        if (!cancelled) setMetadata(m ?? null);
      } catch {
        if (!cancelled) setMetadata(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign?.ipfsHash]);

  const myCampaigns = useMemo(() => (campaign ? [campaign] : []), [campaign]);
  const allTags = useMemo(() => Array.from(new Set(metadata?.tags ?? [])).sort((a, b) => a.localeCompare(b)), [metadata?.tags]);

  const filteredCampaigns = useMemo(() => {
    let list = myCampaigns;
    const now = Math.floor(Date.now() / 1000);
    if (selectedStatus === 'active') {
      list = list.filter((c) => c.active && Number(c.deadline) > now);
    } else if (selectedStatus === 'ended') {
      list = list.filter((c) => !c.active || Number(c.deadline) <= now);
    } else if (selectedStatus === 'goal_reached') {
      list = list.filter((c) => dashboardGoalReached(c));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        const title = metadata?.title?.toLowerCase() ?? '';
        return c.creatorAddress.toLowerCase().includes(q) || (c.l1Address && c.l1Address.toLowerCase().includes(q)) || title.includes(q);
      });
    }
    if (selectedCategory) {
      list = list.filter(() => (metadata?.category ?? null) === selectedCategory);
    }
    if (selectedTags.length > 0) {
      list = list.filter(() => selectedTags.every((t) => (metadata?.tags ?? []).includes(t)));
    }
    return sortCampaigns(list, sortBy);
  }, [myCampaigns, selectedStatus, searchQuery, sortBy, selectedCategory, selectedTags, metadata]);

  const statusCounts = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    let active = 0;
    let ended = 0;
    let goal_reached = 0;
    myCampaigns.forEach((c) => {
      if (c.active && Number(c.deadline) > now) active++;
      else ended++;
      if (dashboardGoalReached(c)) goal_reached++;
    });
    return { all: myCampaigns.length, active, ended, goal_reached };
  }, [myCampaigns]);

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSearchQuery('');
    setSortBy('newest');
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="flex flex-1">
        <div className="hidden lg:block flex-shrink-0">
          <DonationsSidebar
            backLink={{ href: '/donations', label: 'All campaigns' }}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            statusCounts={statusCounts}
          />
        </div>
        <div className="lg:hidden flex-shrink-0">
          <DonationsSidebar
            backLink={{ href: '/donations', label: 'All campaigns' }}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            statusCounts={statusCounts}
          />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">CrowdKAS</p>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">My campaigns</h1>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Manage and track your CrowdKAS campaigns.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/donations/studio" className="k-control-btn !border-emerald-500/30 !bg-emerald-500/10 !text-emerald-800 dark:!text-emerald-300">
                    Create / edit in Studio
                  </Link>
                  <Link href="/donations" className="k-control-btn">
                    Browse all campaigns
                  </Link>
                </div>
              </div>
            </div>

            {(kaspaState.isConnected || myCovenantCampaigns.length > 0) && (
              <section className="mb-10">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">L1 covenant campaigns</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Goal-based raises on Kaspa L1 (simulator, stored on this device).
                    </p>
                  </div>
                  <Link
                    href="/donations/studio#covenant-create"
                    className="k-control-btn !border-teal-500/30 !bg-teal-500/10 !text-teal-800 dark:!text-teal-300"
                  >
                    New L1 campaign
                  </Link>
                </div>
                {!kaspaState.isConnected ? (
                  <p className="text-sm text-zinc-500">Connect Kaspa wallet to manage L1 covenant campaigns.</p>
                ) : covenantLoading && myCovenantCampaigns.length === 0 ? (
                  <p className="text-sm text-zinc-500">Loading...</p>
                ) : myCovenantCampaigns.length === 0 ? (
                  <p className="text-sm text-zinc-500">No L1 covenant campaigns yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myCovenantCampaigns.map((c) => (
                      <CovenantCrowdfundCampaignCard key={c.id} campaign={c} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {!isConnected && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Connect your wallet</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                  Connect your EVM wallet to see your creator campaigns. (This will expand to multiple campaigns once CrowdKAS V2 is live.)
                </p>
              </div>
            )}

            {isConnected && (
              <>
                <div className="flex flex-col gap-4 mb-6">
                  <FilterBar
                    search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search my campaigns...' }}
                    onReset={handleResetFilters}
                    flexWrap={true}
                  >
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
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-900">
                    Loading your campaign…
                  </div>
                )}

                {!isLoading && !error && filteredCampaigns.length === 0 && (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900">
                    <p className="font-medium">No campaigns found</p>
                    <p className="text-sm mt-1">Create your first campaign in the studio.</p>
                    <Link href="/donations/studio" className="inline-block mt-4 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                      Open Studio
                    </Link>
                  </div>
                )}

                {!isLoading && filteredCampaigns.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCampaigns.map((c) => (
                      <DonationCampaignCard key={c.creatorAddress} campaign={c} metadata={metadata} />
                    ))}
                  </div>
                )}

                {filteredCampaigns.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <button type="button" onClick={refetch} className="k-control-btn">
                      Refresh
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

