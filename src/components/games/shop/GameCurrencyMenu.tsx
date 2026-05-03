'use client';

import type { ReactNode } from 'react';
import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from '@/components/ui/Tooltip';

export type GameCurrencyMenuOption = {
  value: string;
  label: string;
  disabled?: boolean;
  /** Shown when hovering this row (e.g. explain why KAS is locked). */
  rowTooltip?: ReactNode;
};

/**
 * Stylized currency picker; menu is portaled to `document.body` with fixed positioning so it is not clipped by
 * parent `overflow-hidden` (e.g. {@link KxListingCard}).
 */
export function GameCurrencyMenu(props: {
  value: string;
  onChange: (next: string) => void;
  options: GameCurrencyMenuOption[];
  ariaLabel?: string;
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const domId = useId();
  const listboxId = `${domId}-listbox`;

  const updateMenuPosition = () => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(r.width, 170);
    const left = props.align === 'right' ? r.right - w : r.left;
    setMenuPos({
      top: r.bottom + 6,
      left,
      width: w,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open, props.align, props.options.length]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const current = props.options.find((o) => o.value === props.value) ?? props.options[0];

  const menu =
    open && props.options.length > 0 && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            id={listboxId}
            ref={menuRef}
            role="listbox"
            className="max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            style={{
              position: 'fixed',
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: 100000,
            }}
          >
            {props.options.map((o) => {
              const btn = (
                <button
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
              );
              if (o.rowTooltip) {
                return (
                  <Tooltip key={o.value} content={o.rowTooltip}>
                    <span className="block w-full">{btn}</span>
                  </Tooltip>
                );
              }
              return <Fragment key={o.value}>{btn}</Fragment>;
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`relative ${props.className ?? ''}`}>
      <button
        ref={buttonRef}
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
      {menu}
    </div>
  );
}
