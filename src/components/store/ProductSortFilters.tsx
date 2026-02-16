'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { SortOption } from '@/lib/store/sorting';

interface ProductSortFiltersProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function ProductSortFilters({ 
  sortBy, 
  onSortChange
}: ProductSortFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ bottom: number; right: number } | null>(null);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !sortTriggerRef.current) {
      setDropdownStyle(null);
      return;
    }
    const rect = sortTriggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      bottom: window.innerHeight - rect.top + 8,
      right: window.innerWidth - rect.right,
    });
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortTriggerRef.current && !sortTriggerRef.current.contains(event.target as Node) &&
          !(event.target as Element).closest('[data-sort-dropdown]')) {
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
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort by...';

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={sortTriggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="k-control-btn w-full"
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
        <>
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          {dropdownStyle && (
            <div
              data-sort-dropdown
              className="fixed w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[50] overflow-hidden"
              style={{ bottom: dropdownStyle.bottom, right: dropdownStyle.right }}
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
        </>
      )}
    </div>
  );
}
