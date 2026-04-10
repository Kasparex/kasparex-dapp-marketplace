'use client';

import { useState, useRef, useEffect } from 'react';
import type { DonationCampaignListItem } from '@/hooks/useDonationCampaigns';
import { totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';

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
      return arr.sort((a, b) => {
        const sortRaised = (c: DonationCampaignListItem) => (c.campaignId != null ? c.raisedWei : totalRaisedWei(c));
        const rb = sortRaised(b);
        const ra = sortRaised(a);
        return rb > ra ? 1 : rb < ra ? -1 : 0;
      });
    case 'least-raised':
      return arr.sort((a, b) => {
        const sortRaised = (c: DonationCampaignListItem) => (c.campaignId != null ? c.raisedWei : totalRaisedWei(c));
        const ra = sortRaised(a);
        const rb = sortRaised(b);
        return ra > rb ? 1 : ra < rb ? -1 : 0;
      });
    case 'ending-soon':
      return arr.sort((a, b) => Number(a.deadline - b.deadline));
    case 'most-donors':
      return arr.sort((a, b) => {
        const sortDonors = (c: DonationCampaignListItem) => (c.campaignId != null ? c.donorCount : totalDonorCount(c));
        const db = sortDonors(b);
        const da = sortDonors(a);
        return db > da ? 1 : db < da ? -1 : 0;
      });
    default:
      return arr;
  }
}

const SORT_OPTIONS: { value: DonationSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
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
  const [isOpen, setIsOpen] = useState(false);
  const sortContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortContainerRef.current && !sortContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label ?? 'Sort by…';

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-shrink-0 overflow-visible" ref={sortContainerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="k-control-btn min-w-[160px]"
        >
          <span className="truncate">{currentLabel}</span>
          <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === option.value
                    ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
