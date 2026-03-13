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
    <div className={`k-control-group h-10 p-1 ${className}`}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`h-full px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${value === option.value
            ? 'bg-[#02abb8] text-white shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
