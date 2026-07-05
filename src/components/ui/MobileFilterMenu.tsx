'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface MobileFilterMenuProps {
  children: ReactNode;
  /** Optional reset action shown inside the mobile filter panel. */
  onReset?: () => void;
  resetLabel?: string;
  /** When true, show a dot on the filter icon (active filters). */
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
 * On mobile, wraps filter controls behind a filter icon button.
 * On md+ screens, children render inline (desktop layout unchanged).
 */
export function MobileFilterMenu({
  children,
  onReset,
  resetLabel = 'Reset Filters',
  hasActiveFilters = false,
  className = '',
}: MobileFilterMenuProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  return (
    <>
      {/* Desktop: inline controls */}
      <div className={`hidden md:flex items-center gap-3 flex-wrap ${className}`.trim()}>{children}</div>

      {/* Mobile: filter menu trigger */}
      <div className="md:hidden relative shrink-0" ref={panelRef}>
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

        {open ? (
          <>
            <div
              className="fixed inset-0 z-[80] bg-black/40 md:hidden"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div className="fixed left-0 right-0 top-16 z-[81] mx-3 mt-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-4 max-h-[min(calc(100dvh-5rem),520px)] overflow-y-auto overscroll-contain md:hidden">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Filters</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Close filters"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-3 kx-mobile-filter-stack">{children}</div>
              {onReset != null ? (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setOpen(false);
                  }}
                  className="k-control-btn w-full mt-3"
                >
                  {resetLabel}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
