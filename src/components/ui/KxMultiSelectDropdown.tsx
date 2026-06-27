'use client';

import { useEffect, useRef, useState } from 'react';

export type KxMultiSelectOption = {
  value: string;
  label: string;
};

export function KxMultiSelectDropdown({
  values,
  onChange,
  options,
  ariaLabel,
  placeholder = 'Select…',
  triggerClassName = 'k-control-btn w-full min-w-0 justify-between',
  menuClassName = 'w-full min-w-[12rem]',
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: KxMultiSelectOption[];
  ariaLabel: string;
  placeholder?: string;
  triggerClassName?: string;
  menuClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const summary =
    values.length === 0
      ? placeholder
      : values.length <= 2
        ? options
            .filter((o) => values.includes(o.value))
            .map((o) => o.label)
            .join(', ')
        : `${values.length} chains selected`;

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={triggerClassName}
      >
        <span className="truncate text-left">{summary}</span>
        <svg className="w-4 h-4 ml-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen ? (
        <div
          className={`absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden max-h-64 overflow-y-auto ${menuClassName}`}
        >
          {options.map((option) => {
            const checked = values.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  checked
                    ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleValue(option.value)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#02abb8] focus:ring-[#02abb8]"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
