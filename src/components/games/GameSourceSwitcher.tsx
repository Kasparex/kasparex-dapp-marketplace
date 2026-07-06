'use client';

import { KxTabStrip } from '@/components/ui/KxTabStrip';
import type { GameSourceFilter } from '@/lib/games/source';

interface GameSourceSwitcherProps {
  value: GameSourceFilter;
  onChange: (value: GameSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: GameSourceFilter; label: string; title: string }[] = [
  { value: 'all', label: 'All', title: 'All games' },
  { value: 'kasparex', label: 'Kasparex', title: 'Official Kasparex games' },
  { value: 'community', label: 'Community', title: 'Community-submitted games' },
];

export function GameSourceSwitcher({ value, onChange, className = '' }: GameSourceSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="Game source filter"
      className={className}
    />
  );
}
