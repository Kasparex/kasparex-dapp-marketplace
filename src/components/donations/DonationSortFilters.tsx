'use client';

import type { DonationCampaignListItem } from '@/hooks/useDonationCampaigns';

export type DonationSortOption = 'newest' | 'oldest' | 'most-raised' | 'least-raised' | 'ending-soon' | 'most-donors';

export function sortCampaigns(
  campaigns: DonationCampaignListItem[],
  sortBy: DonationSortOption
): DonationCampaignListItem[] {
  const arr = [...campaigns];
  switch (sortBy) {
    case 'newest':
      return arr.sort((a, b) => Number(b.deadline - a.deadline));
    case 'oldest':
      return arr.sort((a, b) => Number(a.deadline - b.deadline));
    case 'most-raised':
      return arr.sort((a, b) => (b.raisedWei > a.raisedWei ? 1 : b.raisedWei < a.raisedWei ? -1 : 0));
    case 'least-raised':
      return arr.sort((a, b) => (a.raisedWei > b.raisedWei ? 1 : a.raisedWei < b.raisedWei ? -1 : 0));
    case 'ending-soon':
      return arr.sort((a, b) => Number(a.deadline - b.deadline));
    case 'most-donors':
      return arr.sort((a, b) => (b.donorCount > a.donorCount ? 1 : b.donorCount < a.donorCount ? -1 : 0));
    default:
      return arr;
  }
}

const SORT_OPTIONS: { value: DonationSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most-raised', label: 'Most raised' },
  { value: 'least-raised', label: 'Least raised' },
  { value: 'ending-soon', label: 'Ending soon' },
  { value: 'most-donors', label: 'Most donors' },
];

interface DonationSortFiltersProps {
  sortBy: DonationSortOption;
  onSortChange: (sort: DonationSortOption) => void;
}

export function DonationSortFilters({ sortBy, onSortChange }: DonationSortFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 shrink-0">Sort</span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as DonationSortOption)}
        className="h-10 appearance-none pl-3 pr-8 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        aria-label="Sort campaigns"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
