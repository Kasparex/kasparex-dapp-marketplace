'use client';

interface NetworkSwitcherProps {
  value: 'all' | 'L1' | 'L2';
  onChange: (value: 'all' | 'L1' | 'L2') => void;
  className?: string;
}

export function NetworkSwitcher({ value, onChange, className = '' }: NetworkSwitcherProps) {
  return (
    <div className={`k-control-group h-10 p-1 ${className}`}>
      {(['all', 'L1', 'L2'] as const).map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`h-full min-w-[2.5rem] px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${value === option
            ? 'bg-[#02abb8] text-white shadow-sm'
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
        >
          {option === 'all' ? 'All' : option}
        </button>
      ))}
    </div>
  );
}
