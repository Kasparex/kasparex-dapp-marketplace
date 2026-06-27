'use client';

import type { DAppNetworkFilter } from '@/lib/dapps';

interface NetworkSwitcherProps {
  value: DAppNetworkFilter;
  onChange: (value: DAppNetworkFilter) => void;
  className?: string;
}

const OPTIONS: { value: DAppNetworkFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'L1', label: 'L1' },
  { value: 'L2', label: 'L2' },
  { value: 'MIX', label: 'Mix' },
];

export function NetworkSwitcher({ value, onChange, className = '' }: NetworkSwitcherProps) {
  return (
    <div className={`k-control-group h-10 p-1 ${className}`}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-full min-w-[2.75rem] px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            value === option.value
              ? 'bg-[#02abb8] text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
