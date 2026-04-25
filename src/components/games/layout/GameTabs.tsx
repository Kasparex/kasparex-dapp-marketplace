'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GameTab<T extends string = string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
};

export function GameTabs<T extends string>(props: {
  tabs: readonly GameTab<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drag state in refs — no re-renders during the drag itself
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const dragMoved = useRef(0); // total px moved — used to suppress clicks

  // ── Scroll-state tracker ─────────────────────────────────────────────────
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

  // ── Momentum / inertia after release ────────────────────────────────────
  const runMomentum = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    velocity.current *= 0.88; // friction coefficient
    if (Math.abs(velocity.current) < 0.5) {
      rafId.current = null;
      return;
    }
    el.scrollLeft -= velocity.current;
    rafId.current = requestAnimationFrame(runMomentum);
  }, []);

  // ── Pointer-event drag handlers ──────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!el) return;
    // Cancel any ongoing momentum
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    dragging.current = true;
    dragMoved.current = 0;
    startX.current = e.clientX;
    lastX.current = e.clientX;
    startScroll.current = el.scrollLeft;
    velocity.current = 0;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const el = stripRef.current;
    if (!el) return;
    const dx = e.clientX - startX.current;
    dragMoved.current = Math.abs(dx);
    // Track instantaneous velocity for momentum
    velocity.current = e.clientX - lastX.current;
    lastX.current = e.clientX;
    el.scrollLeft = startScroll.current - dx;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = stripRef.current;
    if (!el || !dragging.current) return;
    dragging.current = false;
    el.style.cursor = '';
    try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    // Kick off momentum if moving fast enough
    if (Math.abs(velocity.current) > 2) {
      rafId.current = requestAnimationFrame(runMomentum);
    }
  }, [runMomentum]);

  // Suppress click on child buttons if the user actually dragged
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragMoved.current > 6) {
      e.stopPropagation();
      e.preventDefault();
      dragMoved.current = 0;
    }
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => () => { if (rafId.current !== null) cancelAnimationFrame(rafId.current); }, []);

  return (
    <div className="relative border-b border-zinc-200 pb-2 dark:border-zinc-800">
      {/* Drag-scrollable tab strip — touch-action: pan-x lets touch scroll naturally */}
      <div
        ref={stripRef}
        className={`flex gap-2 overflow-x-auto select-none transition-[padding] ${canScrollLeft ? 'pl-2' : ''} ${canScrollRight ? 'pr-2' : ''}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: 'grab',
          touchAction: 'pan-x',
        } as React.CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
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

      {/* Subtle edge fades when overflow is present */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white dark:from-zinc-950" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-zinc-950" />
      )}

      {/* Hide webkit scrollbar */}
      <style>{`
        div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
