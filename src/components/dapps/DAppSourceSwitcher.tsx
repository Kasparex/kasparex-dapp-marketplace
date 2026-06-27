'use client';

export type DAppSourceFilter = 'all' | 'kasparex' | 'directory' | 'covenants';

interface DAppSourceSwitcherProps {
  value: DAppSourceFilter;
  onChange: (value: DAppSourceFilter) => void;
  className?: string;
}

const OPTIONS: { value: DAppSourceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'kasparex', label: 'Kasparex' },
  { value: 'directory', label: 'Community' },
  { value: 'covenants', label: 'Covenants' },
];

export function DAppSourceSwitcher({ value, onChange, className = '' }: DAppSourceSwitcherProps) {
  return (
    <div className={`k-control-group h-10 w-fit p-1 ${className}`}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-full whitespace-nowrap px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            value === option.value
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
