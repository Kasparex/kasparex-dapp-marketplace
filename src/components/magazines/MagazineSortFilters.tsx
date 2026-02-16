'use client';

import { useState, useRef, useEffect } from 'react';
import type { MagazineSortOption } from '@/lib/magazines/types';

interface MagazineSortFiltersProps {
  sortBy: MagazineSortOption;
  onSortChange: (sort: MagazineSortOption) => void;
}

export function MagazineSortFilters({ sortBy, onSortChange }: MagazineSortFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sortContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortContainerRef.current && !sortContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const sortOptions: { value: MagazineSortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'alphabetical-az', label: 'Alphabetical (A-Z)' },
    { value: 'alphabetical-za', label: 'Alphabetical (Z-A)' },
  ];

  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label ?? 'Sort by...';

  return (
    <div className="relative flex-shrink-0 overflow-visible" ref={sortContainerRef}>
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
  );
}
