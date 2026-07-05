'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { MobileFilterMenu } from '@/components/ui/MobileFilterMenu';

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
  /** When true, controls may wrap to a second row on desktop (e.g. Chronicles filters + view switcher). */
  flexWrap?: boolean;
  /** When true, show active indicator on mobile filter icon. */
  hasActiveFilters?: boolean;
}

/**
 * Filter bar: search stays visible; other controls collapse under filter menu on mobile.
 */
export function FilterBar({
  search,
  onReset,
  resetLabel = 'Reset Filters',
  children,
  className = '',
  flexWrap = false,
  hasActiveFilters = false,
}: FilterBarProps) {
  const isTyping = (search.value?.length ?? 0) > 0;

  return (
    <div
      className={`flex flex-nowrap items-center gap-2 sm:gap-3 min-h-10 overflow-visible ${className}`.trim()}
    >
      <div className="flex-1 min-w-0 sm:min-w-[200px] shrink overflow-visible">
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

      {children != null ? (
        <MobileFilterMenu
          onReset={onReset}
          resetLabel={resetLabel}
          hasActiveFilters={hasActiveFilters}
          className={flexWrap ? 'flex-wrap' : 'flex-nowrap'}
        >
          {children}
        </MobileFilterMenu>
      ) : null}

      {onReset != null ? (
        <Tooltip content="Reset all filters">
          <button type="button" onClick={onReset} className="k-control-btn whitespace-nowrap shrink-0 hidden md:inline-flex">
            {resetLabel}
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}
