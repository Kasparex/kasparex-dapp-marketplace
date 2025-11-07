'use client';

import { useState } from 'react';

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

interface SortFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  favoritesCount?: number;
}

export function SortFilters({ sortBy, onSortChange, favoritesCount = 0 }: SortFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="relative flex items-center gap-2">
      {/* Favorites Star Button */}
      <button
        onClick={() => {
          // Toggle favorites: if already active, switch to 'newest', otherwise set to 'favorites'
          onSortChange(isFavoritesActive ? 'newest' : 'favorites');
        }}
        className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
          isFavoritesActive
            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
        }`}
        title={isFavoritesActive ? 'Show All' : 'Show Favorites'}
        aria-label={isFavoritesActive ? 'Show All' : 'Show Favorites'}
      >
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
          <span className="ml-1 text-xs font-medium">{favoritesCount}</span>
        )}
      </button>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <span>{currentLabel}</span>
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  sortBy === option.value
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

