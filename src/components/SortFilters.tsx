'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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

interface SortFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  favoritesCount?: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function SortFilters({ sortBy, onSortChange, favoritesCount = 0, viewMode = 'cards', onViewModeChange }: SortFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const sortContainerRef = useRef<HTMLDivElement>(null);
  const plusContainerRef = useRef<HTMLDivElement>(null);

  // Close sort menu when clicking outside (same pattern as wallet dropdown)
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

  // Close plus menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusContainerRef.current && !plusContainerRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };

    if (isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusMenuOpen]);

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
    <div className="flex items-center gap-2">
      {/* View Mode Switcher */}
      {onViewModeChange && (
        <div className="k-control-group">
          <button
            onClick={() => onViewModeChange('cards')}
            className={`p-2.5 transition-colors ${viewMode === 'cards'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
              : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            title="Card view"
            aria-label="Card view"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-2.5 transition-colors border-l border-zinc-200 dark:border-zinc-800 ${viewMode === 'table'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
              : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            title="Table view"
            aria-label="Table view"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('compact')}
            className={`p-2.5 transition-colors border-l border-zinc-200 dark:border-zinc-800 ${viewMode === 'compact'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
              : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            title="Compact view"
            aria-label="Compact view"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Sort Dropdown - absolute so it stays with button on scroll (like wallet) */}
      <div className="relative flex-shrink-0 overflow-visible" ref={sortContainerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="k-control-btn min-w-[160px]"
        >
          <span className="truncate">{currentLabel}</span>
          <svg
            className="w-4 h-4 ml-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

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
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === option.value
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

      {/* Favorites Star Button */}
      <button
        onClick={() => {
          onSortChange(isFavoritesActive ? 'newest' : 'favorites');
        }}
        className={`k-control-icon-btn ${isFavoritesActive
          ? 'bg-yellow-100 dark:bg-yellow-900/30 !border-yellow-300 dark:!border-yellow-700 text-yellow-600 dark:text-yellow-400'
          : ''
          }`}
        title={isFavoritesActive ? 'Show All' : 'Show Favorites'}
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
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#02abb8] px-1 text-[10px] font-bold text-white shadow-sm border border-white dark:border-zinc-900">
              {favoritesCount}
            </span>
          )}
        </div>
      </button>

      {/* Plus Button with Dropdown - absolute so it stays with button on scroll (like wallet) */}
      <div className="relative overflow-visible" ref={plusContainerRef}>
        <button
          type="button"
          onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
          className="k-control-icon-btn"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {isPlusMenuOpen && (
          <div
            data-plus-dropdown
            className="absolute left-0 top-full mt-1.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden"
          >
            <Link
              href="/list-dapp"
              onClick={() => setIsPlusMenuOpen(false)}
              className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              List dApp
            </Link>
            <Link
              href="/build-dapp"
              onClick={() => setIsPlusMenuOpen(false)}
              className="block w-full text-left px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Build dApp
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

