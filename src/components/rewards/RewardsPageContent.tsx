'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { FilterBar } from '@/components/FilterBar';
import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';
import { RedeemPanel } from '@/components/redeem/RedeemPanel';
import {
  filterRewards,
  getUserRewardStatus,
  type RewardItem,
} from '@/lib/rewards/dashboard-data';

type RewardType = 'krex-tier' | 'nft' | 'node' | 'premium';
type RewardStatus = 'unlocked' | 'locked';
type SortKey = 'name-asc' | 'name-desc' | 'unlocked-first' | 'locked-first';

function typeLabel(t: RewardType): string {
  if (t === 'krex-tier') return 'KREX tier';
  if (t === 'nft') return 'NFT';
  if (t === 'node') return 'Node';
  return 'Premium';
}

function badgeForType(t: RewardType): { className: string; label: string } {
  if (t === 'krex-tier') return { className: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-300', label: 'KREX' };
  if (t === 'nft') return { className: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300', label: 'NFT' };
  if (t === 'node') return { className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300', label: 'NODE' };
  return { className: 'bg-violet-500/10 border-violet-500/20 text-violet-700 dark:text-violet-300', label: 'PREMIUM' };
}

function sortRewards(list: RewardItem[], sort: SortKey): RewardItem[] {
  const next = list.slice();
  next.sort((a, b) => {
    if (sort === 'name-asc') return a.name.localeCompare(b.name);
    if (sort === 'name-desc') return b.name.localeCompare(a.name);
    if (sort === 'unlocked-first') return Number(b.isUnlocked) - Number(a.isUnlocked) || a.name.localeCompare(b.name);
    return Number(a.isUnlocked) - Number(b.isUnlocked) || a.name.localeCompare(b.name);
  });
  return next;
}

export function RewardsPageContent() {
  const { balance: krexBalance, tier: krexTier, isLoading: krexLoading } = useKREXBalance();
  const { nftStatus, isLoading: nftLoading } = useNFTStatus();

  // TODO: wire real node status when available
  const hasNode = false;
  const nodeType = undefined as 'light' | 'mirror' | undefined;

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<RewardType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RewardStatus | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('unlocked-first');

  const isLoading = krexLoading || nftLoading;

  const rewards = useMemo(() => {
    if (isLoading) return [];
    return getUserRewardStatus({
      krexTier,
      krexBalance,
      nftStatus: nftStatus ?? {
        hasKREXPRIME: false,
        hasPIXELKREX: false,
        hasDiamondKREXPRIME: false,
        hasDiamondPIXELKREX: false,
        hasRarestNFT: false,
        partnerCollections: {},
        partnerDiamonds: {},
      },
      hasNode,
      nodeType,
    });
  }, [isLoading, krexTier, krexBalance, nftStatus, hasNode, nodeType]);

  const filtered = useMemo(() => {
    const types = typeFilter === 'all' ? undefined : [typeFilter];
    const status = statusFilter === 'all' ? undefined : [statusFilter];
    const base = filterRewards(rewards, { types, status, searchQuery: search });
    return sortRewards(base, sort);
  }, [rewards, typeFilter, statusFilter, search, sort]);

  return (
    <div className="space-y-6">
      <RedeemPanel />
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 p-4 sm:p-5">
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search rewards, requirements, benefits…' }}
          onReset={() => {
            setSearch('');
            setTypeFilter('all');
            setStatusFilter('all');
            setSort('unlocked-first');
          }}
          flexWrap
        >
          <ChroniclesFilterDropdown
            ariaLabel="Filter reward type"
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as RewardType | 'all')}
            allLabel="All types"
            options={[
              { value: 'krex-tier', label: typeLabel('krex-tier') },
              { value: 'nft', label: typeLabel('nft') },
              { value: 'node', label: typeLabel('node') },
              { value: 'premium', label: typeLabel('premium') },
            ]}
            minWidthClassName="min-w-[170px]"
          />
          <ChroniclesFilterDropdown
            ariaLabel="Filter by status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as RewardStatus | 'all')}
            allLabel="All statuses"
            options={[
              { value: 'unlocked', label: 'Unlocked' },
              { value: 'locked', label: 'Locked' },
            ]}
            minWidthClassName="min-w-[160px]"
          />
          <ChroniclesFilterDropdown
            ariaLabel="Sort rewards"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            allLabel="Unlocked first"
            options={[
              { value: 'unlocked-first', label: 'Unlocked first' },
              { value: 'locked-first', label: 'Locked first' },
              { value: 'name-asc', label: 'Name (A–Z)' },
              { value: 'name-desc', label: 'Name (Z–A)' },
            ]}
            minWidthClassName="min-w-[170px]"
          />
        </FilterBar>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">Loading rewards…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-zinc-500 dark:text-zinc-400">No rewards match your filters.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const typeBadge = badgeForType(r.type);
            return (
              <div
                key={r.id}
                className={`rounded-2xl border p-5 transition-colors ${
                  r.isUnlocked
                    ? 'border-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-950/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-black text-zinc-900 dark:text-zinc-100 truncate">{r.name}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${typeBadge.className}`}>
                      {typeBadge.label}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                        r.isUnlocked
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-zinc-500/10 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {r.isUnlocked ? 'Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/70 dark:bg-zinc-950/30 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-zinc-500">Requirement</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">{r.requirement}</span>
                  </div>
                  {r.multiplier != null ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-zinc-500">Multiplier</span>
                      <span className="font-black text-[#02abb8]">{r.multiplier}x</span>
                    </div>
                  ) : null}
                  {r.feeReduction != null ? (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wider text-zinc-500">Fee</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">-{r.feeReduction}%</span>
                    </div>
                  ) : null}
                </div>

                {r.benefits?.length ? (
                  <ul className="mt-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-5">
                    {r.benefits.slice(0, 4).map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {r.type === 'krex-tier' ? (
                    <Link href="/tiers#krex-tier-rewards" className="k-control-btn">
                      Buy KREX
                    </Link>
                  ) : null}
                  {r.type === 'nft' ? (
                    <Link href="/tiers#nft-rewards" className="k-control-btn">
                      Buy NFTs
                    </Link>
                  ) : null}
                  {!r.isUnlocked ? (
                    <Link href={r.type === 'krex-tier' ? '/tiers#krex-tier-rewards' : r.type === 'nft' ? '/tiers#nft-rewards' : '/tiers'} className="k-control-btn">
                      View requirements
                    </Link>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

