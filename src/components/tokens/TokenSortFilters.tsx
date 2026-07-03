'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { TokenType } from '@/lib/tokens/types';
import type {
  TokenPremiumFilter,
  TokenSortOption,
  TokenUtilityFilter,
  TokenVerifiedFilter,
} from '@/lib/tokens/listing';
import { Tooltip } from '@/components/ui/Tooltip';

export type { TokenSortOption } from '@/lib/tokens/listing';

export type TokenTypeFilter = TokenType | 'all';

interface TokenListingFiltersBarProps {
  typeFilter: TokenTypeFilter;
  onTypeFilterChange: (value: TokenTypeFilter) => void;
  sortBy: TokenSortOption;
  onSortChange: (sort: TokenSortOption) => void;
  verifiedFilter: TokenVerifiedFilter;
  onVerifiedFilterChange: (value: TokenVerifiedFilter) => void;
  utilityFilter: TokenUtilityFilter;
  onUtilityFilterChange: (value: TokenUtilityFilter) => void;
  premiumFilter: TokenPremiumFilter;
  onPremiumFilterChange: (value: TokenPremiumFilter) => void;
}

const ALL_TOKENS_OPTIONS: { value: TokenTypeFilter; label: string }[] = [
  { value: 'all', label: 'All tokens' },
  { value: 'global', label: 'Global' },
  { value: 'local', label: 'Local' },
  { value: 'collab', label: 'Collab' },
];

const SORT_OPTIONS: { value: TokenSortOption; label: string }[] = [
  { value: 'verified-first', label: 'Verified first' },
  { value: 'featured-first', label: 'Featured first' },
  { value: 'utility-first', label: 'Utility enabled first' },
  { value: 'activity-high', label: 'Highest activity' },
  { value: 'name-az', label: 'Name (A-Z)' },
  { value: 'name-za', label: 'Name (Z-A)' },
  { value: 'symbol-az', label: 'Symbol (A-Z)' },
  { value: 'price-high', label: 'Price (high to low)' },
  { value: 'price-low', label: 'Price (low to high)' },
  { value: 'market-cap-high', label: 'Market cap (high to low)' },
  { value: 'network', label: 'Network' },
  { value: 'type', label: 'Type' },
];

const VERIFIED_OPTIONS: { value: TokenVerifiedFilter; label: string }[] = [
  { value: 'all', label: 'All tokens' },
  { value: 'verified', label: 'Verified only' },
];

const UTILITY_OPTIONS: { value: TokenUtilityFilter; label: string }[] = [
  { value: 'all', label: 'All utility' },
  { value: 'utility-enabled', label: 'Utility enabled' },
];

const PREMIUM_OPTIONS: { value: TokenPremiumFilter; label: string }[] = [
  { value: 'all', label: 'All listings' },
  { value: 'featured', label: 'Featured only' },
];

function useClickOutside(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return ref;
}

function FilterDropdownButton({
  label,
  isOpen,
  onClick,
  active,
  tooltip,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
  active?: boolean;
  tooltip?: string;
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={`k-control-btn min-w-[140px] ${active ? '!border-[#02abb8]/40 !text-[#02abb8]' : ''}`}
    >
      <span className="truncate">{label}</span>
      <svg className={`w-4 h-4 ml-auto shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
  return tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button;
}

function FilterDropdownMenu({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-0 top-full mt-1.5 min-w-[12rem] max-w-[16rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden">
      {children}
    </div>
  );
}

function FilterDropdownOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
        active
          ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  );
}

function TokenFilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  minWidth = '140px',
  tooltip,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  minWidth?: string;
  tooltip?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(isOpen, () => setIsOpen(false));
  const currentLabel = options.find((opt) => opt.value === value)?.label ?? label;
  const isActive = value !== options[0]?.value;

  return (
    <div className="relative flex-shrink-0 overflow-visible" ref={ref} style={{ minWidth }}>
      <FilterDropdownButton
        label={currentLabel}
        isOpen={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        active={isActive}
        tooltip={tooltip ?? `Filter by ${label.toLowerCase()}`}
      />
      {isOpen ? (
        <FilterDropdownMenu>
          {options.map((option) => (
            <FilterDropdownOption
              key={option.value}
              active={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </FilterDropdownOption>
          ))}
        </FilterDropdownMenu>
      ) : null}
    </div>
  );
}

export function TokenListingFiltersBar({
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortChange,
  verifiedFilter,
  onVerifiedFilterChange,
  utilityFilter,
  onUtilityFilterChange,
  premiumFilter,
  onPremiumFilterChange,
}: TokenListingFiltersBarProps) {
  return (
    <>
      <TokenFilterDropdown
        label="All tokens"
        value={typeFilter}
        options={ALL_TOKENS_OPTIONS}
        onChange={onTypeFilterChange}
        tooltip="Filter by token type"
      />
      <TokenFilterDropdown
        label="Verified"
        value={verifiedFilter}
        options={VERIFIED_OPTIONS}
        onChange={onVerifiedFilterChange}
      />
      <TokenFilterDropdown
        label="Utility"
        value={utilityFilter}
        options={UTILITY_OPTIONS}
        onChange={onUtilityFilterChange}
      />
      <TokenFilterDropdown
        label="Premium"
        value={premiumFilter}
        options={PREMIUM_OPTIONS}
        onChange={onPremiumFilterChange}
      />
      <TokenFilterDropdown
        label="Sort"
        value={sortBy}
        options={SORT_OPTIONS}
        onChange={onSortChange}
        tooltip="Sort tokens"
      />
    </>
  );
}
