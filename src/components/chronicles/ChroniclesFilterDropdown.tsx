'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

export type ChroniclesFilterOption<T extends string> = { value: T; label: string };

export function ChroniclesFilterDropdown<T extends string>({
  ariaLabel,
  value,
  onChange,
  allLabel,
  allValue,
  options,
  minWidthClassName = 'min-w-[180px]',
}: {
  ariaLabel: string;
  value: T | '';
  onChange: (v: T | '') => void;
  allLabel: string;
  allValue?: '';
  options: ChroniclesFilterOption<T>[];
  minWidthClassName?: string;
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
    if (!value) return allLabel;
    return options.find((o) => o.value === value)?.label ?? allLabel;
  }, [value, options, allLabel]);

  return (
    <div ref={rootRef} className="relative flex-shrink-0 overflow-visible">
      <Tooltip content={gameTooltipRich('Active filter', label)} side="bottom" align="start">
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={() => setOpen((v) => !v)}
          className={`k-control-btn ${minWidthClassName}`}
        >
          <span className="truncate">{label}</span>
          <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Tooltip>

      {open ? (
        <div className="absolute left-0 top-full mt-1.5 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange((allValue ?? '') as T | '');
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
              !value ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {allLabel}
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                value === opt.value
                  ? 'bg-[#02abb8]/10 text-[#02abb8] dark:bg-[#02abb8]/20 font-medium'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

