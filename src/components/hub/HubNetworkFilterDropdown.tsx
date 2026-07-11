'use client';

import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import type { DAppNetworkFilter } from '@/lib/dapps';

const NETWORK_OPTIONS: { value: DAppNetworkFilter; label: string }[] = [
  { value: 'all', label: 'All networks' },
  { value: 'L1', label: 'L1 only' },
  { value: 'L2', label: 'L2 only' },
  { value: 'MULTI', label: 'Multi-network' },
];

export function HubNetworkFilterDropdown({
  value,
  onChange,
  triggerClassName = 'k-control-btn min-w-[150px] h-10',
}: {
  value: DAppNetworkFilter;
  onChange: (value: DAppNetworkFilter) => void;
  triggerClassName?: string;
}) {
  return (
    <KxFilterDropdown
      value={value}
      onChange={onChange}
      options={NETWORK_OPTIONS}
      ariaLabel="Filter by network"
      triggerClassName={triggerClassName}
      menuClassName="w-56"
    />
  );
}
