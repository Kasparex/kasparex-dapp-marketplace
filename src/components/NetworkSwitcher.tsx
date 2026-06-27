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
  { value: 'MULTI', label: 'Multi' },
];

export function NetworkSwitcher({ value, onChange, className = '' }: NetworkSwitcherProps) {
  return (
    <div className={`k-segment-group ${className}`.trim()}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`k-segment-option ${value === option.value ? 'k-segment-option-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
