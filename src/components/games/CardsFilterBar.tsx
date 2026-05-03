'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

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

  return (
    <div className="flex flex-wrap items-center gap-3 w-full mb-6 overflow-visible">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-zinc-950 text-sm outline-none transition-all"
        />
      </div>
 
       {/* Category Dropdown */}
       <div className="relative flex-shrink-0" ref={categoryRef}>
           <button
             type="button"
             onClick={() => setIsCategoryOpen(!isCategoryOpen)}
             className="flex h-10 min-w-[160px] items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
           >
             <span className="truncate">{currentCategoryLabel}</span>
             <svg className={`w-4 h-4 ml-auto transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
           </button>
           
           {isCategoryOpen && (
             <div data-sort-dropdown className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden">
               <button
                 type="button"
                 onClick={() => {
                   onCategoryChange('all');
                   setIsCategoryOpen(false);
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
                     setIsCategoryOpen(false);
                   }}
                   className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                     category === c
                       ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium'
                       : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                   }`}
                 >
                   <span>{c}</span>
                   {categoryTrailing?.[c] != null ? (
                     <span className="shrink-0">{categoryTrailing[c]}</span>
                   ) : null}
                 </button>
               ))}
             </div>
           )}
         </div>
 
       {/* Sorting Dropdown */}
       <div className="relative flex-shrink-0" ref={sortRef}>
         <button
           type="button"
           onClick={() => setIsSortOpen(!isSortOpen)}
           className="flex h-10 min-w-[160px] items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
         >
           <span className="truncate">{currentSortLabel}</span>
           <svg className={`w-4 h-4 ml-auto transition-transform ${isSortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
         </button>

        {isSortOpen && (
          <div data-sort-dropdown className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setIsSortOpen(false);
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
        )}
      </div>

      {trailing ? (
        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">{trailing}</div>
      ) : null}
    </div>
  );
}
