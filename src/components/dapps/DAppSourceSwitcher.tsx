'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';

export type DAppSourceFilter = 'all' | 'kasparex' | 'directory' | 'covenants';

interface DAppSourceSwitcherProps {
  value: DAppSourceFilter;
  onChange: (value: DAppSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: DAppSourceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'kasparex', label: 'Kasparex' },
  { value: 'directory', label: 'Community' },
  { value: 'covenants', label: 'Covenants' },
];

export function DAppSourceSwitcher({ value, onChange, className = '' }: DAppSourceSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="dApp source filter"
      className={className}
    />
  );
}
