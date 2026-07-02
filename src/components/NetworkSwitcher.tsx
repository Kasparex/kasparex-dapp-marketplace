'use client';

import type { DAppNetworkFilter } from '@/lib/dapps';
import { KxTabStrip } from '@/components/ui/KxTabStrip';

interface NetworkSwitcherProps {
  value: DAppNetworkFilter;
  onChange: (value: DAppNetworkFilter) => void;
  className?: string;
}

const OPTIONS: { value: DAppNetworkFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All networks' },
  { value: 'L1', label: 'L1', title: 'Kaspa L1' },
  { value: 'L2', label: 'L2', title: 'EVM Layer-2' },
  { value: 'MULTI', label: 'Multi', title: 'Multichain' },
];

export function NetworkSwitcher({ value, onChange, className = '' }: NetworkSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="Network filter"
      className={className}
    />
  );
}
