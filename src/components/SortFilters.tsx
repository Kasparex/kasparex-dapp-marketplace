'use client';

import { useState, useRef, useEffect } from 'react';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { Tooltip } from '@/components/ui/Tooltip';

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'alphabetical-az'
  | 'alphabetical-za'
  | 'status'
  | 'network'
  | 'favorites'
  | 'likes-high'
  | 'likes-low';

export type ViewMode = 'cards' | 'table' | 'compact';

export const VIEW_MODE_OPTIONS = [
  {
    value: 'cards' as const,
    title: 'Card view',
    ariaLabel: 'Card view',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    value: 'table' as const,
    title: 'Table view',
    ariaLabel: 'Table view',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'compact' as const,
    title: 'Compact view',
    ariaLabel: 'Compact view',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
];

interface SortFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  favoritesCount?: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function SortFilters({ sortBy, onSortChange, favoritesCount = 0, viewMode = 'cards', onViewModeChange }: SortFiltersProps) {
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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newly Created' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'alphabetical-az', label: 'Alphabetical (A-Z)' },
    { value: 'alphabetical-za', label: 'Alphabetical (Z-A)' },
    { value: 'status', label: 'By Status' },
    { value: 'network', label: 'By Network' },
    { value: 'favorites', label: 'Favorites' },
    { value: 'likes-high', label: 'Most Likes (High)' },
    { value: 'likes-low', label: 'Most Likes (Low)' },
  ];

  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort by...';
  const isFavoritesActive = sortBy === 'favorites';

  return (
    <div className="flex items-center gap-2 kx-mobile-filter-sort-row">
      {onViewModeChange ? (
        <KxTabStrip
          value={viewMode}
          onChange={onViewModeChange}
          options={VIEW_MODE_OPTIONS}
          ariaLabel="View mode"
          iconOnly
        />
      ) : null}

      <div className="relative flex-shrink-0 overflow-visible" ref={sortContainerRef}>
        <Tooltip content="Sort">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="k-control-btn min-w-[160px]"
          >
            <span className="truncate">{currentLabel}</span>
            <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </Tooltip>

        {isOpen && (
          <div
            data-sort-dropdown
            className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden"
          >
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === option.value
                    ? 'hub-filter-dropdown-item-active'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Tooltip content={isFavoritesActive ? 'Show all' : 'Show favorites'}>
      <button
        onClick={() => {
          onSortChange(isFavoritesActive ? 'newest' : 'favorites');
        }}
        className={`k-control-icon-btn ${
          isFavoritesActive
            ? 'bg-yellow-100 dark:bg-yellow-900/30 !border-yellow-300 dark:!border-yellow-700 text-yellow-600 dark:text-yellow-400'
            : ''
        }`}
        aria-label={isFavoritesActive ? 'Show All' : 'Show Favorites'}
      >
        <div className="relative flex items-center justify-center">
          <svg
            className="w-5 h-5"
            fill={isFavoritesActive ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          {favoritesCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[var(--hub-accent)] px-1 text-[10px] font-bold text-white shadow-sm border border-white dark:border-zinc-900">
              {favoritesCount}
            </span>
          )}
        </div>
      </button>
      </Tooltip>
    </div>
  );
}
