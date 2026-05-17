'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GameTab<T extends string = string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
};

const TAB_ACTIVE =
  'bg-emerald-500/10 text-emerald-900 dark:text-emerald-300';
const TAB_INACTIVE =
  'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800';

/**
 * Kasparex Games tab strip: same segmented control shell as Profile Hub (`k-control-group`),
 * with emerald active state for gameplay accents.
 */
export function GameTabs<T extends string>(props: {
  tabs: readonly GameTab<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const dragging = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const rafId = useRef<number | null>(null);
  const totalMoved = useRef(0);

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

  const onWindowMouseUp = useCallback(() => {
    stopDrag();
  }, [stopDrag]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
    },
    [onWindowMouseMove, onWindowMouseUp],
  );

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (totalMoved.current > 6) {
      e.stopPropagation();
      e.preventDefault();
      totalMoved.current = 0;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [onWindowMouseMove, onWindowMouseUp]);

  return (
    <div className="relative mb-6">
      <div
        ref={stripRef}
        className="k-control-group flex w-full min-w-0 flex-nowrap items-stretch overflow-x-auto select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={
          {
            cursor: 'grab',
            touchAction: 'pan-x',
          } as React.CSSProperties
        }
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
      >
        {props.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => props.onChange(t.id)}
            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
              props.value === t.id ? TAB_ACTIVE : TAB_INACTIVE
            }`}
          >
            <span className="pointer-events-none inline-flex items-center gap-2">
              {t.icon ? <span className="inline-flex h-4 w-4 items-center justify-center shrink-0">{t.icon}</span> : null}
              <span>{t.label}</span>
              {t.rightAdornment ? <span className="inline-flex items-center">{t.rightAdornment}</span> : null}
            </span>
          </button>
        ))}
      </div>

      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-white dark:from-zinc-950" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-white dark:from-zinc-950" />
      )}
    </div>
  );
}
