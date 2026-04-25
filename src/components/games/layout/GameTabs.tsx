'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GameTab<T extends string = string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
};

function ChevronLeft() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  );
}

export function GameTabs<T extends string>(props: {
  tabs: readonly GameTab<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drag-scroll state (stored in refs to avoid re-renders mid-drag)
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);
  // Track total drag distance so we can suppress click if user actually dragged
  const dragDistance = useRef(0);

  const updateScrollState = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -160 : 160, behavior: 'smooth' });
  }, []);

  // ── Drag-to-scroll handlers ──────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!el) return;
    isDragging.current = true;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragStartScrollLeft.current = el.scrollLeft;
    dragDistance.current = 0;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!isDragging.current || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - dragStartX.current;
    dragDistance.current = Math.abs(walk);
    el.scrollLeft = dragStartScrollLeft.current - walk;
  }, []);

  const stopDrag = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    isDragging.current = false;
    el.style.cursor = '';
    el.style.userSelect = '';
  }, []);

  // Suppress tab click if user dragged more than a few pixels
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragDistance.current > 5) {
      e.stopPropagation();
      e.preventDefault();
      dragDistance.current = 0;
    }
  }, []);
  // ────────────────────────────────────────────────────────────────────────

  const chevronBase =
    'absolute top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm text-zinc-500 transition-opacity hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100';

  return (
    <div className="relative border-b border-zinc-200 pb-2 dark:border-zinc-800">
      {/* Left chevron */}
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Scroll tabs left"
          className={`${chevronBase} left-0`}
          onClick={() => scroll('left')}
        >
          <ChevronLeft />
        </button>
      )}

      {/* Scrollable + drag-scrollable tab strip */}
      <div
        ref={stripRef}
        className={`flex gap-2 overflow-x-auto select-none transition-[padding] ${canScrollLeft ? 'pl-9' : ''} ${canScrollRight ? 'pr-9' : ''}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', cursor: 'grab' } as React.CSSProperties}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onClickCapture={onClickCapture}
      >
        {props.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => props.onChange(t.id)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              props.value === t.id
                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {t.icon ? (
                <span className="inline-flex h-4 w-4 items-center justify-center">{t.icon}</span>
              ) : null}
              <span className="whitespace-nowrap">{t.label}</span>
              {t.rightAdornment ? (
                <span className="inline-flex items-center">{t.rightAdornment}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {/* Right chevron */}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Scroll tabs right"
          className={`${chevronBase} right-0`}
          onClick={() => scroll('right')}
        >
          <ChevronRight />
        </button>
      )}

      {/* Right-edge fade hint for overflow */}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-8 w-8 bg-gradient-to-l from-white dark:from-zinc-950" />
      )}

      {/* Hide webkit scrollbar */}
      <style>{`
        div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
