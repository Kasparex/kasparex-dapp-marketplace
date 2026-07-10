'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';

export interface MobileFilterMenuProps {
  children: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  hasActiveFilters?: boolean;
  className?: string;
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

/**
 * On mobile, wraps filter controls in a bottom sheet (network switcher, sort, etc.).
 * On md+ screens, children render inline.
 */
export function MobileFilterMenu({
  children,
  onReset,
  resetLabel = 'Reset Filters',
  hasActiveFilters = false,
  className = '',
}: MobileFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobileViewport();

  useBodyScrollLock(open && isMobile);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const mobileSheet =
    open && mounted && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[80] bg-black/50 md:hidden"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed inset-x-0 bottom-0 z-[81] md:hidden flex flex-col max-h-[min(75dvh,520px)] rounded-t-2xl border border-zinc-200 dark:border-zinc-800 border-b-0 bg-white dark:bg-zinc-950 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Filters</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Close filters"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain shrink min-h-0 max-h-[calc(75dvh-7.5rem)] px-4 py-2.5">
                <div className="flex flex-col gap-3 kx-mobile-filter-stack">{children}</div>
              </div>
              {onReset != null ? (
                <div className="shrink-0 px-4 py-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      onReset();
                      setOpen(false);
                    }}
                    className="k-control-btn w-full"
                  >
                    {resetLabel}
                  </button>
                </div>
              ) : null}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <div className={`hidden md:flex items-center gap-3 min-w-0 overflow-x-auto ${className || 'flex-nowrap'}`.trim()}>{children}</div>

      <div className="md:hidden relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="k-control-icon-btn relative"
          aria-label={open ? 'Close filters' : 'Open filters'}
          aria-expanded={open}
        >
          <FilterIcon className="h-5 w-5" />
          {hasActiveFilters ? (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#02abb8] border border-white dark:border-zinc-950" />
          ) : null}
        </button>
      </div>

      {mobileSheet}
    </>
  );
}
