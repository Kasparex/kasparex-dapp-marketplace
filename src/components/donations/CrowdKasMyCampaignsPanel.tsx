'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Address } from 'viem';
import { FilterBar } from '@/components/FilterBar';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { DonationCampaignCard } from '@/components/donations/DonationCampaignCard';
import { CovenantCrowdfundCampaignCard } from '@/components/donations/CovenantCrowdfundCampaignCard';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import type { DonationCampaignV2ListItem } from '@/hooks/useDonationCampaignsV2';
import type { DonationCampaignListItem } from '@/hooks/useDonationCampaigns';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import type { CrowdfundCampaign } from '@/lib/covenant/crowdfund-types';

type StatusFilter = 'all' | 'active' | 'ended';
type MethodFilter = 'all' | 'l2' | 'l1';

function toListItem(c: DonationCampaignV2ListItem): DonationCampaignListItem {
  return {
    campaignId: c.campaignId,
    creatorAddress: c.creatorAddress,
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

export function CrowdKasMyCampaignsPanel({
  l2Campaigns,
  covenantCampaigns,
  creatorAddress,
  isLoading,
  error,
  onRefresh,
  onEdit,
  onClaim,
  onDelete,
  onEditCovenant,
  onDeleteCovenant,
}: {
  l2Campaigns: DonationCampaignV2ListItem[];
  covenantCampaigns: CrowdfundCampaign[];
  creatorAddress?: Address;
  isLoading?: boolean;
  error?: Error | null;
  onRefresh: () => void;
  onEdit: (campaignId: bigint, ipfsHash: string, l1Address: string, targetWei: bigint, deadline: bigint) => void;
  onClaim: (campaignId: bigint) => void;
  onDelete: (campaignId: bigint) => void;
  onEditCovenant?: (campaign: CrowdfundCampaign) => void;
  onDeleteCovenant?: (campaignId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [metadataById, setMetadataById] = useState<Record<string, DonationCampaignMetadata | null>>({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        l2Campaigns.map(async (c) => {
          const key = c.campaignId.toString();
          if (!c.ipfsHash?.trim()) return [key, null] as const;
          try {
            const meta = await fetchCampaignMetadata(c.ipfsHash);
            return [key, meta] as const;
          } catch {
            return [key, null] as const;
          }
        }),
      );
      if (!cancelled) {
        setMetadataById(Object.fromEntries(entries));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [l2Campaigns]);

  const nowSec = Math.floor(Date.now() / 1000);

  const filteredL2 = useMemo(() => {
    const q = search.trim().toLowerCase();
    return l2Campaigns.filter((c) => {
      if (!c.active) return false;
      const meta = metadataById[c.campaignId.toString()];
      const title = meta?.title?.toLowerCase() ?? '';
      const isLive = c.active && Number(c.deadline) > nowSec;
      if (statusFilter === 'active' && !isLive) return false;
      if (statusFilter === 'ended' && isLive) return false;
      if (methodFilter === 'l1' && c.method !== 'L1_DIRECT') return false;
      if (methodFilter === 'l2' && c.method !== 'L2_ESCROW') return false;
      if (q && !title.includes(q) && !c.campaignId.toString().includes(q)) return false;
      return true;
    });
  }, [l2Campaigns, metadataById, methodFilter, nowSec, search, statusFilter]);

  const filteredCovenant = useMemo(() => {
    const q = search.trim().toLowerCase();
    return covenantCampaigns.filter((c) => {
      if (methodFilter === 'l2') return false;
      const title = (c.title ?? '').toLowerCase();
      const isLive = c.status === 'funding';
      if (statusFilter === 'active' && !isLive) return false;
      if (statusFilter === 'ended' && isLive) return false;
      if (q && !title.includes(q) && !c.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [covenantCampaigns, methodFilter, search, statusFilter]);

  const hasActiveFilters = statusFilter !== 'all' || methodFilter !== 'all' || search.trim().length > 0;
  const totalVisible = filteredL2.length + filteredCovenant.length;

  return (
    <div id="crowdkas-dashboard-archive" className="scroll-mt-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: 'Search campaigns…' }}
        onReset={() => {
          setSearch('');
          setStatusFilter('all');
          setMethodFilter('all');
        }}
        hasActiveFilters={hasActiveFilters}
      >
        <KxFilterDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All status' },
            { value: 'active', label: 'Active' },
            { value: 'ended', label: 'Ended' },
          ]}
          ariaLabel="Status filter"
          triggerClassName="k-control-btn min-w-[160px] h-10"
        />
        <KxFilterDropdown
          value={methodFilter}
          onChange={setMethodFilter}
          options={[
            { value: 'all', label: 'All types' },
            { value: 'l2', label: 'L2 escrow' },
            { value: 'l1', label: 'L1 covenant' },
          ]}
          ariaLabel="Method filter"
          triggerClassName="k-control-btn min-w-[160px] h-10"
        />
        <button type="button" className="k-control-btn h-10 shrink-0" onClick={onRefresh}>
          Refresh
        </button>
      </FilterBar>

      {error ? (
        <div className="rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4">{error.message}</div>
      ) : null}

      {isLoading ? <div className="kx-body">Loading campaigns…</div> : null}

      {!isLoading && totalVisible === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">No campaigns match your filters.</p>
          <Link href="/donations/studio?tab=l2-escrow" className="k-control-btn !bg-emerald-600 !text-white inline-flex">
            Create a campaign
          </Link>
        </div>
      ) : null}

      {!isLoading && totalVisible > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch w-full">
          {filteredCovenant.map((c) => {
            const backers = c.pledges.filter((p) => !p.refunded).length;
            const canDeleteCovenant = backers === 0;
            return (
              <CovenantCrowdfundCampaignCard
                key={`covenant-${c.id}`}
                campaign={c}
                footer={
                  onEditCovenant || onDeleteCovenant ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {onEditCovenant ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCovenant(c);
                          }}
                          className="flex-1 k-control-btn justify-center !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700"
                        >
                          Edit
                        </button>
                      ) : null}
                      {onDeleteCovenant ? (
                        <button
                          type="button"
                          disabled={!canDeleteCovenant}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCovenant(c.id);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  ) : undefined
                }
              />
            );
          })}
          {filteredL2.map((c) => {
            const listItem = toListItem(c);
            const key = c.campaignId.toString();
            const meta = metadataById[key] ?? null;
            const deadlinePassed = BigInt(nowSec) >= c.deadline;
            const targetReached = c.method === 'L2_ESCROW' && c.raisedWei >= c.targetWei;
            const isRowCreator =
              Boolean(creatorAddress) && c.creatorAddress.toLowerCase() === (creatorAddress as string).toLowerCase();
            const canClaimV2 = isRowCreator && c.method === 'L2_ESCROW' && targetReached && deadlinePassed;
            const canDeleteCampaign =
              c.active &&
              c.raisedWei === 0n &&
              c.donorCount === 0n &&
              (c.l1RecordedTotalWei ?? 0n) === 0n &&
              (c.l1RecordedDonationCount ?? 0n) === 0n;

            return (
              <DonationCampaignCard
                key={key}
                campaign={listItem}
                metadata={meta}
                href={
                  creatorAddress
                    ? `/donations/${creatorAddress}?campaignId=${c.campaignId.toString()}`
                    : undefined
                }
                badges={[
                  {
                    label: c.method === 'L1_DIRECT' ? 'L1 • Direct' : 'L2 • Igra',
                    variant: 'neutral',
                  },
                  ...(c.featuredModuleUnlocked ? [{ label: 'Featured', variant: 'amber' as const }] : []),
                ]}
                footer={
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(c.campaignId, c.ipfsHash, c.l1Address, c.targetWei, c.deadline)}
                      className="flex-1 k-control-btn justify-center !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700"
                    >
                      Edit
                    </button>
                    {canClaimV2 ? (
                      <button
                        type="button"
                        onClick={() => onClaim(c.campaignId)}
                        className="flex-1 k-control-btn justify-center"
                      >
                        Claim
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={!canDeleteCampaign}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.campaignId);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                    >
                      Delete
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
