'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type KxMultiSelectOption = {
  value: string;
  label: string;
  /** Optional right-side badge (e.g. session length / price hint). */
  badge?: string;
};

export function KxMultiSelectDropdown({
  values,
  onChange,
  options,
  ariaLabel,
  placeholder = 'Select…',
  filterPlaceholder = 'Filter…',
  showFilter = false,
  triggerClassName = 'k-field-trigger min-w-[140px] h-10 w-full',
  menuClassName = 'w-64',
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: KxMultiSelectOption[];
  ariaLabel: string;
  placeholder?: string;
  filterPlaceholder?: string;
  showFilter?: boolean;
  triggerClassName?: string;
  menuClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const label =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? options.find((o) => o.value === values[0])?.label ?? values[0]
        : `${values.length} selected`;

  const checkedBoxClass = 'bg-[var(--hub-accent,#10b981)] border-[var(--hub-accent,#10b981)]';

  return (
    <div className="relative flex-shrink-0 overflow-visible w-auto" ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className={triggerClassName}
      >
        <span className="truncate">{label}</span>
        <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full z-[9999] mt-1.5 overflow-hidden ${
            triggerClassName.includes('k-field-trigger')
              ? 'k-field-menu'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg'
          } ${menuClassName}`}
        >
          {showFilter ? (
            <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={filterPlaceholder}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
              />
            </div>
          ) : null}
          <div className="max-h-[280px] overflow-auto">
            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">No options</div>
            )}
            {filteredOptions.map((option) => {
              const checked = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? checkedBoxClass : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.badge ? (
                    <span className="ml-2 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {option.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {values.length > 0 && (
            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => onChange([])}
                className="k-control-btn w-full justify-center"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
