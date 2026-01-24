'use client';

interface NetworkSwitcherProps {
  value: 'all' | 'L1' | 'L2';
  onChange: (value: 'all' | 'L1' | 'L2') => void;
  className?: string;
}

export function NetworkSwitcher({ value, onChange, className = '' }: NetworkSwitcherProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {(['all', 'L1', 'L2'] as const).map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${value === option
              ? 'bg-[#02abb8] text-white'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
        >
          {option === 'all' ? 'All' : option}
        </button>
      ))}
    </div>
  );
}
