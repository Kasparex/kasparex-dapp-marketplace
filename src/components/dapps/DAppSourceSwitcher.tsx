'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';

export type DAppSourceFilter = 'all' | 'kasparex' | 'directory' | 'covenants';

interface DAppSourceSwitcherProps {
  value: DAppSourceFilter;
  onChange: (value: DAppSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: DAppSourceFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All sources' },
  { value: 'kasparex', label: 'Kasparex', title: 'Official Kasparex dApps' },
  { value: 'directory', label: 'Community', title: 'Community listings' },
  { value: 'covenants', label: 'Covenants', title: 'Covenant dApps' },
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
