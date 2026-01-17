'use client';

interface NetworkSwitcherProps {
  value: 'all' | 'L1' | 'L2';
  onChange: (value: 'all' | 'L1' | 'L2') => void;
  className?: string;
}

export function NetworkSwitcher({ value, onChange, className = '' }: NetworkSwitcherProps) {
  return (
    <div className={`inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 ${className}`}>
      {(['all', 'L1', 'L2'] as const).map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            value === option
              ? 'bg-[#02abb8] text-white shadow-sm'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          {option === 'all' ? 'All' : option}
        </button>
      ))}
    </div>
  );
}
