'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';

export type StatsSourceFilter = 'all' | 'kasparex' | 'network';

interface StatsSourceSwitcherProps {
  value: StatsSourceFilter;
  onChange: (value: StatsSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: StatsSourceFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All metrics' },
  { value: 'kasparex', label: 'Kasparex', title: 'Kasparex platform metrics' },
  { value: 'network', label: 'Network', title: 'Kaspa network metrics' },
];

export function StatsSourceSwitcher({ value, onChange, className = '' }: StatsSourceSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="Stats source filter"
      className={className}
    />
  );
}
