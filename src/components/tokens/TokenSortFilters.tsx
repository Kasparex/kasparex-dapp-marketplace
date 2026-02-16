'use client';

import { useState, useRef, useEffect } from 'react';
import type { TokenSortField, TokenSortDirection } from './TokenListingTable';

interface TokenSortFiltersProps {
  sortField: TokenSortField;
  sortDirection: TokenSortDirection;
  onSortChange: (field: TokenSortField, direction: TokenSortDirection) => void;
}

const SORT_OPTIONS: { value: TokenSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'symbol', label: 'Symbol' },
  { value: 'network', label: 'Network' },
  { value: 'type', label: 'Type' },
  { value: 'price', label: 'Price' },
  { value: 'marketCap', label: 'Market Cap' },
];

export function TokenSortFilters({ sortField, sortDirection, onSortChange }: TokenSortFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortField)?.label ?? 'Sort by...';

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="k-control-btn flex items-center gap-2 min-w-[140px]"
      >
        <span className="truncate">{currentLabel}</span>
        <span className="text-zinc-400 text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 py-1 min-w-[160px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-50">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const nextDir = sortField === opt.value && sortDirection === 'asc' ? 'desc' : 'asc';
                onSortChange(opt.value, nextDir);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                sortField === opt.value
                  ? 'bg-[#02abb8]/10 text-[#02abb8] font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
