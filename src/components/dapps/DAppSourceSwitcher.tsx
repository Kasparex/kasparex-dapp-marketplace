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
    <div className={`k-segment-group w-fit ${className}`.trim()}>
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
