'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { VBlogSortOption } from '@/lib/vblog/listing';
import { Tooltip } from '@/components/ui/Tooltip';

export type { VBlogSortOption } from '@/lib/vblog/listing';

interface VBlogSortFiltersProps {
  sortBy: VBlogSortOption;
  onSortChange: (sort: VBlogSortOption) => void;
}

interface VBlogFilterDropdownProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  minWidth?: string;
}

const SORT_OPTIONS: { value: VBlogSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest published' },
  { value: 'oldest', label: 'Oldest published' },
  { value: 'updated-newest', label: 'Recently updated' },
  { value: 'updated-oldest', label: 'Least recently updated' },
  { value: 'alphabetical-az', label: 'Title (A-Z)' },
  { value: 'alphabetical-za', label: 'Title (Z-A)' },
  { value: 'category-az', label: 'Category (A-Z)' },
  { value: 'category-za', label: 'Category (Z-A)' },
  { value: 'magazine-first', label: 'Magazine issues first' },
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
      className={`k-control-btn min-w-[170px] ${active ? '!border-[color:var(--hub-accent-border)] !text-[color:var(--hub-accent)]' : ''}`}
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
          ? 'bg-[color:var(--hub-accent-muted)] text-[color:var(--hub-accent)] dark:bg-[color:var(--hub-accent-muted)] font-medium'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  );
}

function VBlogFilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  minWidth = '170px',
}: VBlogFilterDropdownProps<T>) {
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
        tooltip={`Filter by ${label.toLowerCase()}`}
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

export function VBlogSortFilters({ sortBy, onSortChange }: VBlogSortFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside(isOpen, () => setIsOpen(false));
  const currentLabel = SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || 'Sort by...';

  return (
    <div className="relative flex-shrink-0 overflow-visible min-w-[170px]" ref={ref}>
      <FilterDropdownButton label={currentLabel} isOpen={isOpen} onClick={() => setIsOpen((open) => !open)} tooltip="Sort" />
      {isOpen ? (
        <FilterDropdownMenu>
          {SORT_OPTIONS.map((option) => (
            <FilterDropdownOption
              key={option.value}
              active={sortBy === option.value}
              onClick={() => {
                onSortChange(option.value);
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
