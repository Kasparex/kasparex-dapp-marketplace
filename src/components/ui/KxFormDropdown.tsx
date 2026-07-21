'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type KxFormDropdownOption = { value: string; label: string; disabled?: boolean };

export function KxFormDropdown({
  ariaLabel,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled,
  className,
  triggerClassName,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: KxFormDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const label = useMemo(() => {
    const match = options.find((o) => o.value === value);
    return match?.label ?? placeholder;
  }, [value, options, placeholder]);

  return (
    <div ref={rootRef} className={`relative w-full ${className ?? ''}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`k-select w-full text-left disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName ?? ''}`.trim()}
      >
        <span className="truncate">{label}</span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="k-menu-surface absolute left-0 top-full z-[80] mt-1.5 w-full min-w-[12rem] overflow-hidden rounded-xl shadow-lg max-h-64 overflow-y-auto"
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            if (opt.disabled) {
              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={false}
                  aria-disabled
                  className="w-full cursor-not-allowed px-4 py-2.5 text-sm text-zinc-400 dark:text-zinc-600"
                >
                  {opt.label}
                </div>
              );
            }
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  selected
                    ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-semibold'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-[#02abb8]/8 hover:text-[#02abb8] dark:hover:bg-[#02abb8]/15 dark:hover:text-[#66dfe8]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
