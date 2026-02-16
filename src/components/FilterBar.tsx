'use client';

import type { ReactNode } from 'react';

export interface FilterBarSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface FilterBarProps {
  /** Search input (value, onChange, placeholder). */
  search: FilterBarSearchProps;
  /** Optional callback for Reset Filters button. When provided, the button is shown. */
  onReset?: () => void;
  /** Label for the reset button. */
  resetLabel?: string;
  /** Content between search and reset (e.g. NetworkSwitcher, SortFilters). All in one row with consistent height (h-10). */
  children?: ReactNode;
  /** Optional class for the wrapper. */
  className?: string;
}

/**
 * Single-row filter bar: search, optional middle content (chips, sort, view, favorites, etc.), optional Reset.
 * Keeps all controls aligned (e.g. h-10) and prevents wrapping into a second row.
 */
export function FilterBar({
  search,
  onReset,
  resetLabel = 'Reset Filters',
  children,
  className = '',
}: FilterBarProps) {
  const isTyping = (search.value?.length ?? 0) > 0;

  return (
    <div className={`flex flex-nowrap items-center gap-3 min-h-10 overflow-visible ${className}`.trim()}>
      <div className="flex-1 min-w-[200px] shrink-0 overflow-visible">
        <div className="k-search-container h-10">
          <input
            type="text"
            placeholder={search.placeholder ?? 'Search...'}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className={`k-search-input h-10 ${isTyping ? 'is-typing' : ''}`.trim()}
          />
        </div>
      </div>
      {children}
      {onReset != null && (
        <button type="button" onClick={onReset} className="k-control-btn whitespace-nowrap shrink-0">
          {resetLabel}
        </button>
      )}
    </div>
  );
}
