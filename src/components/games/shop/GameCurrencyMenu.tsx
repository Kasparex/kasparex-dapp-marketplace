'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type GameCurrencyMenuOption = { value: string; label: string; disabled?: boolean };

/**
 * Stylized currency / option picker matching {@link CardsFilterBar} sort control (rounded-xl, chevron, emerald selection).
 */
export function GameCurrencyMenu(props: {
  value: string;
  onChange: (next: string) => void;
  options: GameCurrencyMenuOption[];
  ariaLabel?: string;
  /** Dropdown aligns with button edge. */
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const domId = useId();
  const listboxId = `${domId}-listbox`;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = props.options.find((o) => o.value === props.value) ?? props.options[0];
  const alignCls = props.align === 'right' ? 'right-0' : 'left-0';

  return (
    <div className={`relative ${props.className ?? ''}`} ref={wrapRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={props.ariaLabel ?? 'Choose payment option'}
        onClick={() => setOpen((v) => !v)}
        className={
          props.buttonClassName ??
          'flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 sm:w-auto sm:min-w-[170px] sm:flex-1'
        }
      >
        <span className="min-w-0 truncate text-left font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {current?.label ?? props.value}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && props.options.length > 0 ? (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-[9999] mt-1.5 max-h-72 min-w-full overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900 ${alignCls}`}
        >
          {props.options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === props.value}
              disabled={o.disabled}
              onClick={() => {
                if (o.disabled) return;
                props.onChange(o.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                o.value === props.value
                  ? 'bg-emerald-500/10 font-medium text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
