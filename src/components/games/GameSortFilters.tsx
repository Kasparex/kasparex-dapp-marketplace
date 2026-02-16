'use client';

import { useState, useRef, useEffect } from 'react';
import { GameSortOption } from '@/lib/games/sorting';

export type GameViewMode = 'grid' | 'compact' | 'list';

interface GameSortFiltersProps {
  sortBy: GameSortOption;
  onSortChange: (sort: GameSortOption) => void;
  favoritesCount?: number;
  viewMode?: GameViewMode;
  onViewModeChange?: (mode: GameViewMode) => void;
}

export function GameSortFilters({ 
  sortBy, 
  onSortChange, 
  favoritesCount = 0, 
  viewMode = 'grid', 
  onViewModeChange 
}: GameSortFiltersProps) {
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

  const sortOptions: { value: GameSortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'alphabetical-az', label: 'Alphabetical (A-Z)' },
    { value: 'alphabetical-za', label: 'Alphabetical (Z-A)' },
    { value: 'cost-low', label: 'Cost: Low to High' },
    { value: 'cost-high', label: 'Cost: High to Low' },
    { value: 'difficulty', label: 'By Difficulty' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'favorites', label: 'Favorites' },
    { value: 'likes-high', label: 'Most Likes' },
    { value: 'likes-low', label: 'Least Likes' },
  ];

  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort by...';
  const isFavoritesActive = sortBy === 'favorites';

  return (
    <div className="flex items-center gap-2">
      {/* View Mode Switcher */}
      {onViewModeChange && (
        <div className="k-control-group">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="Grid view"
            aria-label="Grid view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('compact')}
            className={`p-2.5 transition-colors border-l border-zinc-200 dark:border-zinc-800 ${
              viewMode === 'compact'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="Compact view"
            aria-label="Compact view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2.5 transition-colors border-l border-zinc-200 dark:border-zinc-800 ${
              viewMode === 'list'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-[#02abb8]'
                : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
            title="List view"
            aria-label="List view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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

      {/* Favorites Star Button */}
      <button
        onClick={() => {
          onSortChange(isFavoritesActive ? 'newest' : 'favorites');
        }}
        className={`k-control-icon-btn ${
          isFavoritesActive
            ? '!bg-yellow-100 dark:!bg-yellow-900/30 !border-yellow-300 dark:!border-yellow-700 text-yellow-600 dark:text-yellow-400'
            : ''
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
    </div>
  );
}
