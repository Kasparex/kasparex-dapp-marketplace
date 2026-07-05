'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { computeFloatingPlacement } from '@/lib/ui/floatingPosition';

export const KASPPAREX_TOOLTIP_SURFACE_CLASS =
  'z-[100000] w-max max-w-sm rounded-lg bg-zinc-100 px-3 py-2.5 text-sm leading-snug text-zinc-800 shadow-xl border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600';

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

function wrapChild(children: React.ReactNode): React.ReactElement {
  if (React.isValidElement(children)) return children;
  return <span className="inline-flex">{children}</span>;
}

const LONG_PRESS_MS = 400;

/**
 * Desktop: hover tooltip following the cursor.
 * Mobile: tap-and-hold to show; releases on finger up.
 */
export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 });
  const [placement, setPlacement] = React.useState({ left: 0, top: 0 });
  const [ready, setReady] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef(content);
  const longPressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchActiveRef = React.useRef(false);

  contentRef.current = content;

  const child = wrapChild(children);

  const p = child.props as {
    onPointerEnter?: (ev: React.PointerEvent) => void;
    onPointerLeave?: (ev: React.PointerEvent) => void;
    onPointerMove?: (ev: React.PointerEvent) => void;
    onPointerDown?: (ev: React.PointerEvent) => void;
    onPointerUp?: (ev: React.PointerEvent) => void;
    onPointerCancel?: (ev: React.PointerEvent) => void;
  };

  const clearLongPress = React.useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const updatePlacement = React.useCallback((x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el || typeof window === 'undefined') return;

    const rect = el.getBoundingClientRect();
    const next = computeFloatingPlacement(
      { x, y },
      { width: rect.width, height: rect.height },
      { width: window.innerWidth, height: window.innerHeight },
    );
    setPlacement((prev) => (prev.left === next.left && prev.top === next.top ? prev : next));
    setReady(true);
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    updatePlacement(anchor.x, anchor.y);
  }, [open, anchor.x, anchor.y, updatePlacement]);

  React.useEffect(() => () => clearLongPress(), [clearLongPress]);

  const merged = React.cloneElement(child, {
    onPointerDown: (e: React.PointerEvent) => {
      p.onPointerDown?.(e);
      if (e.pointerType === 'touch') {
        touchActiveRef.current = true;
        clearLongPress();
        const x = e.clientX;
        const y = e.clientY;
        longPressTimerRef.current = setTimeout(() => {
          setAnchor({ x, y });
          setOpen(true);
        }, LONG_PRESS_MS);
      }
    },
    onPointerUp: (e: React.PointerEvent) => {
      p.onPointerUp?.(e);
      clearLongPress();
      if (e.pointerType === 'touch' || touchActiveRef.current) {
        touchActiveRef.current = false;
        setOpen(false);
      }
    },
    onPointerCancel: (e: React.PointerEvent) => {
      p.onPointerCancel?.(e);
      clearLongPress();
      touchActiveRef.current = false;
      setOpen(false);
    },
    onPointerEnter: (e: React.PointerEvent) => {
      p.onPointerEnter?.(e);
      if (e.pointerType === 'touch') return;
      setAnchor({ x: e.clientX, y: e.clientY });
      setOpen(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      p.onPointerLeave?.(e);
      if (e.pointerType === 'touch') return;
      setOpen(false);
    },
    onPointerMove: (e: React.PointerEvent) => {
      p.onPointerMove?.(e);
      if (e.pointerType === 'touch') {
        if (open) {
          setAnchor({ x: e.clientX, y: e.clientY });
        }
        return;
      }
      setAnchor({ x: e.clientX, y: e.clientY });
      if (open) updatePlacement(e.clientX, e.clientY);
    },
  } as Record<string, unknown>);

  const portal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={`${KASPPAREX_TOOLTIP_SURFACE_CLASS} ${className}`.trim()}
            style={{
              position: 'fixed',
              left: placement.left,
              top: placement.top,
              pointerEvents: 'none',
              visibility: ready ? 'visible' : 'hidden',
            }}
          >
            {contentRef.current}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      {merged}
      {portal}
    </>
  );
}
