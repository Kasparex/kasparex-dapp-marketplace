'use client';

import type { TokenType } from '@/lib/tokens/types';
import { KxTabStrip } from '@/components/ui/KxTabStrip';

interface TokenTypeSwitcherProps {
  value: TokenType | 'all';
  onChange: (value: TokenType | 'all') => void;
  className?: string;
}

const OPTIONS: { value: TokenType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'global', label: 'Global' },
  { value: 'local', label: 'Local' },
  { value: 'collab', label: 'Collab' },
];

export function TokenTypeSwitcher({ value, onChange, className = '' }: TokenTypeSwitcherProps) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={OPTIONS}
      ariaLabel="Token type filter"
      className={className}
    />
  );
}
