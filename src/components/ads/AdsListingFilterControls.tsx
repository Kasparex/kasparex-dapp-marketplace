'use client';

import { useEffect, useRef, useState } from 'react';
import { AD_SLOTS } from '@/lib/ads/slots';
import type { AdFormat, AdSlotId } from '@/lib/ads/types';

export type AdsSortOption = 'newest' | 'ending-soon' | 'slot' | 'format';

interface AdsListingFilterControlsProps {
  formatFilter: AdFormat | 'all';
  onFormatChange: (f: AdFormat | 'all') => void;
  slotFilter: AdSlotId | 'all';
  onSlotChange: (s: AdSlotId | 'all') => void;
  sortBy: AdsSortOption;
  onSortChange: (s: AdsSortOption) => void;
}

const formatOptions: { value: AdFormat | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'square', label: 'Square' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'tall', label: 'Tall' },
];

const sortOptions: { value: AdsSortOption; label: string }[] = [
  { value: 'newest', label: 'Newly Created' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'slot', label: 'By Slot' },
  { value: 'format', label: 'By Format' },
];

export function AdsListingFilterControls({
  formatFilter,
  onFormatChange,
  slotFilter,
  onSlotChange,
  sortBy,
  onSortChange,
}: AdsListingFilterControlsProps) {
  const [slotOpen, setSlotOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setSlotOpen(false);
        setSortOpen(false);
      }
    };
    if (slotOpen || sortOpen) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [slotOpen, sortOpen]);

  const slotLabel =
    slotFilter === 'all' ? 'All slots' : (AD_SLOTS.find((s) => s.id === slotFilter)?.label ?? 'All slots');
  const sortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? 'Sort by...';

  return (
    <div ref={rootRef} className="flex items-center gap-2 flex-shrink-0 overflow-visible">
      <div className="k-control-group h-10 p-1 flex min-w-0 max-w-full overflow-x-auto">
        {formatOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onFormatChange(opt.value)}
            className={`h-full shrink-0 px-2 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
              formatFilter === opt.value
                ? 'bg-[#02abb8] text-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative flex-shrink-0 overflow-visible">
        <button
          type="button"
          onClick={() => {
            setSortOpen(false);
            setSlotOpen((v) => !v);
          }}
          className="k-control-btn min-w-[160px]"
        >
          <span className="truncate">{slotLabel}</span>
          <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {slotOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                onSlotChange('all');
                setSlotOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                slotFilter === 'all'
                  ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              All slots
            </button>
            {AD_SLOTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSlotChange(s.id);
                  setSlotOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  slotFilter === s.id
                    ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex-shrink-0 overflow-visible">
        <button
          type="button"
          onClick={() => {
            setSlotOpen(false);
            setSortOpen((v) => !v);
          }}
          className="k-control-btn min-w-[160px]"
        >
          <span className="truncate">{sortLabel}</span>
          <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {sortOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSortChange(opt.value);
                  setSortOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === opt.value
                    ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
