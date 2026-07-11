'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';
import type { DonationNetworkFilterValue } from '@/components/donations/DonationTaxonomyFilters';

const OPTIONS: { value: DonationNetworkFilterValue; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All networks' },
  { value: 'l1', label: 'L1', title: 'Kaspa L1 covenant campaigns' },
  { value: 'l2', label: 'L2', title: 'L2 escrow (Igra)' },
];

export function DonationNetworkSwitcher({
  value,
  onChange,
  className = '',
}: {
  value: DonationNetworkFilterValue;
  onChange: (value: DonationNetworkFilterValue) => void;
  className?: string;
}) {
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
