'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';

export type AiSourceFilter = 'all' | 'kasparex' | 'community';

interface AiSourceSwitcherProps {
  value: AiSourceFilter;
  onChange: (value: AiSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: AiSourceFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All agents' },
  { value: 'kasparex', label: 'Kasparex', title: 'Official Kasparex agents' },
  { value: 'community', label: 'Community', title: 'Community agents' },
];

export function AiSourceSwitcher({ value, onChange, className = '' }: AiSourceSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="AI agent source filter"
      className={className}
    />
  );
}
