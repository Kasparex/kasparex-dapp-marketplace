'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';

export type AdsSourceFilter = 'all' | 'halo' | 'sidebar' | 'footer';

interface AdsSourceSwitcherProps {
  value: AdsSourceFilter;
  onChange: (value: AdsSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: AdsSourceFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All placements' },
  { value: 'halo', label: 'Halo', title: 'Halo placements' },
  { value: 'sidebar', label: 'Sidebar', title: 'Sidebar placements' },
  { value: 'footer', label: 'Footer', title: 'Footer placements' },
];

export function AdsSourceSwitcher({ value, onChange, className = '' }: AdsSourceSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="Ad placement filter"
      className={className}
    />
  );
}
