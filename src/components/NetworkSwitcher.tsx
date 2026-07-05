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
  { value: 'L1', label: 'L1', title: 'Tokens available on Kaspa L1' },
  { value: 'L2', label: 'L2', title: 'Tokens available on Kaspa L2' },
  { value: 'MULTI', label: 'Multi', title: 'Tokens on more than one network or protocol' },
];

export function NetworkSwitcher({ value, onChange, className = '' }: NetworkSwitcherProps) {
  return (
    <div className={`min-w-0 w-full md:w-auto ${className}`.trim()}>
      <p className="md:hidden text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
        Network
      </p>
      <KxTabStrip
        value={value}
        onChange={onChange}
        options={OPTIONS}
        ariaLabel="Network filter"
        className="w-full max-w-full"
        scrollable
      />
    </div>
  );
}
