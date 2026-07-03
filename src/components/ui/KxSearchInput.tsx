'use client';

export interface KxSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  /** Default h-10 (FilterBar). Compact uses h-9 for sidebars. */
  size?: 'default' | 'compact';
  className?: string;
}

/**
 * Standard Kasparex search field (same capsule styling as FilterBar / main listing search).
 */
export function KxSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  'aria-label': ariaLabel,
  size = 'default',
  className = '',
}: KxSearchInputProps) {
  const heightClass = size === 'compact' ? 'h-9' : 'h-10';
  const isTyping = value.length > 0;

  return (
    <div className={`k-search-container ${heightClass} ${className}`.trim()}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={`k-search-input ${heightClass} ${isTyping ? 'is-typing' : ''}`.trim()}
      />
    </div>
  );
}
