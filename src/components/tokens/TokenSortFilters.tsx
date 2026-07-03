'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { TokenPremiumFilter } from '@/lib/tokens/listing';
import {
  TOKEN_SORT_CONTROL_OPTIONS,
  type TokenSortControlValue,
} from '@/lib/tokens/sortControls';
import { Tooltip } from '@/components/ui/Tooltip';

interface TokenListingFiltersBarProps {
  sortControl: TokenSortControlValue;
  onSortControlChange: (value: TokenSortControlValue) => void;
  premiumFilter: TokenPremiumFilter;
  onPremiumFilterChange: (value: TokenPremiumFilter) => void;
}

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
        tooltip={tooltip ?? label}
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
  sortControl,
  onSortControlChange,
  premiumFilter,
  onPremiumFilterChange,
}: TokenListingFiltersBarProps) {
  return (
    <>
      <TokenFilterDropdown
        label="Sort tokens"
        value={sortControl}
        options={TOKEN_SORT_CONTROL_OPTIONS}
        onChange={onSortControlChange}
        minWidth="160px"
        tooltip="Sort and filter tokens"
      />
      <TokenFilterDropdown
        label="Premium"
        value={premiumFilter}
        options={PREMIUM_OPTIONS}
        onChange={onPremiumFilterChange}
      />
    </>
  );
}
