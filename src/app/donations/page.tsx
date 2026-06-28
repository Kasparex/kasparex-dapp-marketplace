'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useDonationCampaigns, type DonationCampaignListItem } from '@/hooks/useDonationCampaigns';
import { useDonationCampaignsV2, type DonationCampaignV2ListItem } from '@/hooks/useDonationCampaignsV2';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { getContractAddress } from '@/lib/contracts/addresses';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import { DonationsSidebar, type DonationFilterStatus } from '@/components/donations/DonationsSidebar';
import { DonationsHeader } from '@/components/donations/DonationsHeader';
import { DonationSortFilters, sortCampaigns, type DonationSortOption } from '@/components/donations/DonationSortFilters';
import { DonationCampaignCard } from '@/components/donations/DonationCampaignCard';
import { CovenantCrowdfundCampaignCard } from '@/components/donations/CovenantCrowdfundCampaignCard';
import { DonationCategoryFilter, DonationNetworkFilter, DonationTagMultiFilter, type DonationNetworkFilterValue } from '@/components/donations/DonationTaxonomyFilters';
import { FilterBar } from '@/components/FilterBar';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import { totalRaisedWei } from '@/lib/donations/totals';
import { filterCovenantCampaigns, covenantStatusCounts } from '@/lib/donations/covenantCrowdfund';

function campaignGoalReached(c: DonationCampaignListItem): boolean {
  const v2 = c.campaignId != null;
  const raised = v2 ? c.raisedWei : totalRaisedWei(c);
  return raised >= c.targetWei;
}

function mapV2Row(c: DonationCampaignV2ListItem): DonationCampaignListItem {
  return {
    creatorAddress: c.creatorAddress,
    campaignId: c.campaignId,
    donationMethod: c.method,
    targetWei: c.targetWei,
    deadline: c.deadline,
    raisedWei: c.raisedWei,
    donorCount: c.donorCount,
    l1RecordedTotalWei: c.l1RecordedTotalWei,
    l1RecordedDonationCount: c.l1RecordedDonationCount,
    ipfsHash: c.ipfsHash,
    l1Address: c.l1Address,
    active: c.active,
    featuredModuleUnlocked: c.featuredModuleUnlocked,
  };
}

function donationListMetaKey(c: DonationCampaignListItem): string {
  return c.campaignId != null ? `${c.creatorAddress}-${c.campaignId.toString()}` : c.creatorAddress;
}

export default function DonationsListingPage() {
  const hideV1Listing = process.env.NEXT_PUBLIC_CROWDKAS_HIDE_V1 === '1';
  const v2Configured = Boolean(getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrowV2'));
  const v1 = useDonationCampaigns();
  const v2 = useDonationCampaignsV2();
  const covenantCrowdfund = useCovenantCrowdfund();
  const v2Rows = useMemo(() => v2.campaigns.map(mapV2Row), [v2.campaigns]);
  /** When V2 is deployed, show legacy V1 escrow rows and all V2 campaigns unless NEXT_PUBLIC_CROWDKAS_HIDE_V1=1. */
  const campaigns = useMemo(() => {
    if (!v2Configured) return v1.campaigns;
    if (hideV1Listing) return v2Rows;
    return [...v1.campaigns, ...v2Rows];
  }, [v2Configured, hideV1Listing, v1.campaigns, v2Rows]);
  const isLoading =
    (v2Configured && !hideV1Listing ? v1.isLoading || v2.isLoading : v2Configured ? v2.isLoading : v1.isLoading) ||
    covenantCrowdfund.loading;
  const error =
    (!v2Configured ? v1.error : hideV1Listing ? v2.error : v1.error ?? v2.error) ?? covenantCrowdfund.error;
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
    let goal_reached = 0;
    campaigns.forEach((c) => {
      if (c.active && Number(c.deadline) > now) active++;
      else ended++;
      if (campaignGoalReached(c)) goal_reached++;
    });
    const cov = covenantStatusCounts(covenantCrowdfund.allCampaigns);
    return {
      all: campaigns.length + cov.all,
      active: active + cov.active,
      ended: ended + cov.ended,
      goal_reached: goal_reached + cov.goal_reached,
    };
  }, [campaigns, covenantCrowdfund.allCampaigns]);

  const filteredCovenantCampaigns = useMemo(
    () =>
      filterCovenantCampaigns(covenantCrowdfund.allCampaigns, {
        status: selectedStatus,
        search: searchQuery,
        network: selectedNetwork,
      }),
    [covenantCrowdfund.allCampaigns, selectedStatus, searchQuery, selectedNetwork]
  );

  const filteredCampaigns = useMemo(() => {
    let list = campaigns;
    const now = Math.floor(Date.now() / 1000);
    if (selectedStatus === 'active') {
      list = list.filter((c) => c.active && Number(c.deadline) > now);
    } else if (selectedStatus === 'ended') {
      list = list.filter((c) => !c.active || Number(c.deadline) <= now);
    } else if (selectedStatus === 'goal_reached') {
      list = list.filter((c) => campaignGoalReached(c));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => {
        const meta = metaByCreator[donationListMetaKey(c)];
        const title = meta?.title?.toLowerCase() ?? '';
        return (
          c.creatorAddress.toLowerCase().includes(q) ||
          (c.l1Address && c.l1Address.toLowerCase().includes(q)) ||
          title.includes(q)
        );
      });
    }
    if (selectedCategory) {
      list = list.filter((c) => (metaByCreator[donationListMetaKey(c)]?.category ?? null) === selectedCategory);
    }
    if (selectedTags.length > 0) {
      list = list.filter((c) => {
        const tags = metaByCreator[donationListMetaKey(c)]?.tags ?? [];
        return selectedTags.every((t) => tags.includes(t));
      });
    }
    if (selectedNetwork === 'l2') {
      list = list.filter((c) => !c.donationMethod || c.donationMethod === 'L2_ESCROW');
    } else if (selectedNetwork === 'l1') {
      list = list.filter((c) => c.donationMethod === 'L1_DIRECT');
    }
    return sortCampaigns(list, sortBy);
  }, [campaigns, selectedStatus, searchQuery, sortBy, selectedCategory, selectedTags, selectedNetwork, metaByCreator]);

  const showL2Grid = selectedNetwork !== 'l1';
  const showCovenantGrid = selectedNetwork !== 'l2';
  const totalVisible = (showL2Grid ? filteredCampaigns.length : 0) + (showCovenantGrid ? filteredCovenantCampaigns.length : 0);

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
    const keys = campaigns.map(donationListMetaKey);
    const missing = keys.filter((k) => metaByCreator[k] === undefined);
    if (missing.length === 0) return;

    missing.forEach((key) => {
      (async () => {
        const c = campaigns.find((x) => donationListMetaKey(x) === key);
        if (!c?.ipfsHash) {
          if (!cancelled) setMetaByCreator((prev) => ({ ...prev, [key]: null }));
          return;
        }
        try {
          const m = await fetchCampaignMetadata(c.ipfsHash);
          if (!cancelled) setMetaByCreator((prev) => ({ ...prev, [key]: m ?? null }));
        } catch {
          if (!cancelled) setMetaByCreator((prev) => ({ ...prev, [key]: null }));
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
              <p className="kx-body">
                {isLoading
                  ? 'Loading...'
                  : `${totalVisible} campaign${totalVisible !== 1 ? 's' : ''} found`}
                {!isLoading && filteredCovenantCampaigns.length > 0 ? (
                  <span className="text-zinc-500"> · includes L1 covenant simulator campaigns on this device</span>
                ) : null}
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
                {typeof error === 'string' ? error : error.message}
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

            {!isLoading && !error && totalVisible === 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 dark:text-zinc-400">
                <p className="font-medium">No campaigns match your filters</p>
                <p className="text-sm mt-1">Try changing filters or create a campaign from the studio.</p>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  <Link
                    href="/donations/studio#create"
                    className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    L2 campaign (Studio)
                  </Link>
                  <Link
                    href="/donations/studio#covenant-create"
                    className="inline-block px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                  >
                    L1 covenant campaign
                  </Link>
                </div>
              </div>
            )}

            {!isLoading && totalVisible > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {showCovenantGrid &&
                  filteredCovenantCampaigns.map((c) => (
                    <CovenantCrowdfundCampaignCard key={`covenant-${c.id}`} campaign={c} />
                  ))}
                {showL2Grid &&
                  filteredCampaigns.map((c) => (
                    <DonationCampaignCard
                      key={donationListMetaKey(c)}
                      campaign={c}
                      metadata={metaByCreator[donationListMetaKey(c)] ?? null}
                      href={
                        c.campaignId != null
                          ? `/donations/${c.creatorAddress}?campaignId=${c.campaignId.toString()}`
                          : undefined
                      }
                      badges={[
                        {
                          label: c.donationMethod === 'L1_DIRECT' ? 'L1 • Direct' : 'L2 • Igra',
                          variant: 'neutral',
                        },
                        ...(c.featuredModuleUnlocked
                          ? [{ label: 'Featured', variant: 'amber' as const }]
                          : []),
                      ]}
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
