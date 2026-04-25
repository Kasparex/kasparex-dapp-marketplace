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

  // All drag state in refs — zero re-renders during the drag
  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const totalMoved = useRef(0); // total px moved — suppresses click if > threshold

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

  // ── Momentum ─────────────────────────────────────────────────────────────
  const runMomentum = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    velocity.current *= 0.88;
    if (Math.abs(velocity.current) < 0.5) {
      rafId.current = null;
      return;
    }
    el.scrollLeft -= velocity.current;
    rafId.current = requestAnimationFrame(runMomentum);
  }, []);

  // ── Global move / up handlers attached on mousedown, removed on mouseup ──
  const stopDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const el = stripRef.current;
    if (el) el.style.cursor = '';
    if (Math.abs(velocity.current) > 2) {
      rafId.current = requestAnimationFrame(runMomentum);
    }
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup', onWindowMouseUp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runMomentum]);

  // These need to be stable references so we can remove them
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onWindowMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const el = stripRef.current;
    if (!el) return;
    const dx = e.clientX - startX.current;
    totalMoved.current = Math.abs(dx);
    velocity.current = e.clientX - lastX.current;
    lastX.current = e.clientX;
    el.scrollLeft = startScroll.current - dx;
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onWindowMouseUp = useCallback(() => {
    stopDrag();
  }, [stopDrag]);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only primary button
    if (e.button !== 0) return;
    const el = stripRef.current;
    if (!el) return;
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    dragging.current = true;
    totalMoved.current = 0;
    startX.current = e.clientX;
    lastX.current = e.clientX;
    startScroll.current = el.scrollLeft;
    velocity.current = 0;
    el.style.cursor = 'grabbing';
    // Attach window listeners so drag works even outside the element
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
  }, [onWindowMouseMove, onWindowMouseUp]);

  // Suppress tab button onClick if the user genuinely dragged
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (totalMoved.current > 6) {
      e.stopPropagation();
      e.preventDefault();
      totalMoved.current = 0;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [onWindowMouseMove, onWindowMouseUp]);

  return (
    <div className="relative border-b border-zinc-200 pb-2 dark:border-zinc-800">
      {/* Drag-scrollable tab strip */}
      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          cursor: 'grab',
          touchAction: 'pan-x',
        } as React.CSSProperties}
        onMouseDown={onMouseDown}
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
            <span className="inline-flex items-center gap-2 pointer-events-none">
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

      {/* Edge fade hints */}
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
