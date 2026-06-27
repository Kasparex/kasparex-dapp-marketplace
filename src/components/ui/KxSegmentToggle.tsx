'use client';

export type KxSegmentToggleOption<T extends string = string> = {
  value: T;
  label: string;
};

export function KxSegmentToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
}: {
  value: T;
  onChange: (next: T) => void;
  options: KxSegmentToggleOption<T>[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`k-segment-group k-segment-group-full ${className}`.trim()}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
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
