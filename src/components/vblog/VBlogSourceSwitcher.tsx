'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';
import type { VBlogSourceFilter } from '@/lib/vblog/source';

interface VBlogSourceSwitcherProps {
  value: VBlogSourceFilter;
  onChange: (value: VBlogSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: VBlogSourceFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All sources' },
  { value: 'kasparex', label: 'Kasparex', title: 'Official Kasparex articles' },
  { value: 'community', label: 'Community', title: 'Community articles' },
];

export function VBlogSourceSwitcher({ value, onChange, className = '' }: VBlogSourceSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="Article source filter"
      className={className}
    />
  );
}
