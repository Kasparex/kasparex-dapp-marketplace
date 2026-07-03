'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';
import type { TokenSourceFilter } from '@/lib/tokens/source';

interface TokenSourceSwitcherProps {
  value: TokenSourceFilter;
  onChange: (value: TokenSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: TokenSourceFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All listed tokens' },
  { value: 'kasparex', label: 'Kasparex', title: 'Official Kasparex ecosystem tokens' },
  { value: 'community', label: 'Community', title: 'Community collaboration tokens' },
  { value: 'developer', label: 'Developer', title: 'Developer-listed token projects (UaaS)' },
];

export function TokenSourceSwitcher({ value, onChange, className = '' }: TokenSourceSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="Token listing source filter"
      className={className}
    />
  );
}
