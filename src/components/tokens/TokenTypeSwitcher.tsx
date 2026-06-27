'use client';

import type { TokenType } from '@/lib/tokens/types';

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
    <div className={`k-segment-group ${className}`.trim()}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`k-segment-option ${value === option.value ? 'k-segment-option-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
