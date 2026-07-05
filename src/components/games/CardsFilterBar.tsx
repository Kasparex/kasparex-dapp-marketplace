'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { MobileFilterMenu } from '@/components/ui/MobileFilterMenu';

export interface CardsFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  sortBy: string;
  onSortChange: (val: string) => void;
  /** Optional right-aligned label per category key (excludes `all`). */
  categoryTrailing?: Partial<Record<string, ReactNode>>;
  /** Rendered after search + dropdowns (e.g. bulk actions). */
  trailing?: ReactNode;
}

function CategoryDropdown({
  category,
  onCategoryChange,
  categories,
  categoryTrailing,
  isOpen,
  setIsOpen,
  categoryRef,
  currentCategoryLabel,
}: {
  category: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  categoryTrailing?: Partial<Record<string, ReactNode>>;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  categoryRef: React.RefObject<HTMLDivElement | null>;
  currentCategoryLabel: string;
}) {
  return (
    <div className="relative w-full md:w-auto flex-shrink-0" ref={categoryRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full md:min-w-[160px] items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <span className="truncate">{currentCategoryLabel}</span>
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen ? (
        <div
          data-sort-dropdown
          className="absolute left-0 top-full mt-1.5 w-full md:w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden max-h-60 overflow-y-auto"
        >
          <button
            type="button"
            onClick={() => {
              onCategoryChange('all');
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              category === 'all'
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onCategoryChange(c);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                category === c
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <span>{c}</span>
              {categoryTrailing?.[c] != null ? <span className="shrink-0">{categoryTrailing[c]}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SortDropdown({
  sortBy,
  onSortChange,
  isOpen,
  setIsOpen,
  sortRef,
  currentSortLabel,
  sortOptions,
}: {
  sortBy: string;
  onSortChange: (val: string) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  sortRef: React.RefObject<HTMLDivElement | null>;
  currentSortLabel: string;
  sortOptions: { value: string; label: string }[];
}) {
  return (
    <div className="relative w-full md:w-auto flex-shrink-0" ref={sortRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full md:min-w-[160px] items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        <span className="truncate">{currentSortLabel}</span>
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen ? (
        <div
          data-sort-dropdown
          className="absolute right-0 top-full mt-1.5 w-full md:w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden"
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
                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CardsFilterBar({
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  sortBy,
  onSortChange,
  categoryTrailing,
  trailing,
}: CardsFilterBarProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
  ];

  const currentSortLabel = sortOptions.find((o) => o.value === sortBy)?.label || 'Sort by...';
  const currentCategoryLabel = category === 'all' ? 'All Categories' : category;
  const hasActiveFilters = category !== 'all' || sortBy !== 'recommended';

  const filterControls = (
    <>
      <CategoryDropdown
        category={category}
        onCategoryChange={onCategoryChange}
        categories={categories}
        categoryTrailing={categoryTrailing}
        isOpen={isCategoryOpen}
        setIsOpen={setIsCategoryOpen}
        categoryRef={categoryRef}
        currentCategoryLabel={currentCategoryLabel}
      />
      <SortDropdown
        sortBy={sortBy}
        onSortChange={onSortChange}
        isOpen={isSortOpen}
        setIsOpen={setIsSortOpen}
        sortRef={sortRef}
        currentSortLabel={currentSortLabel}
        sortOptions={sortOptions}
      />
    </>
  );

  return (
    <div className="flex flex-nowrap items-center gap-2 sm:gap-3 w-full mb-6 overflow-visible">
      <div className="flex-1 min-w-0">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-zinc-950 text-sm outline-none transition-all"
        />
      </div>

      <MobileFilterMenu hasActiveFilters={hasActiveFilters || !!trailing}>
        {filterControls}
        {trailing ? <div className="flex flex-wrap items-center gap-2 md:hidden">{trailing}</div> : null}
      </MobileFilterMenu>

      {trailing ? (
        <div className="hidden md:flex shrink-0 items-center gap-2 sm:ml-auto">{trailing}</div>
      ) : null}
    </div>
  );
}
