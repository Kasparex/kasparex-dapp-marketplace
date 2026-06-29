'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { computeFloatingPlacement } from '@/lib/ui/floatingPosition';

/**
 * Shared surface for Kasparex tooltips (wallet dropdowns, form hints, ads, games, etc.).
 */
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
  /** @deprecated Position is ignored; tooltips follow the pointer with edge-aware flipping. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** @deprecated Alignment is ignored; tooltips follow the pointer with edge-aware flipping. */
  align?: 'start' | 'center' | 'end';
  className?: string;
}

function wrapChild(children: React.ReactNode): React.ReactElement {
  if (React.isValidElement(children)) return children;
  return <span className="inline-flex">{children}</span>;
}

/**
 * Hover tooltip that follows the cursor and flips when near viewport edges.
 */
export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 });
  const [placement, setPlacement] = React.useState({ left: 0, top: 0 });
  const [ready, setReady] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const child = wrapChild(children);

  const p = child.props as {
    onPointerEnter?: (ev: React.PointerEvent) => void;
    onPointerLeave?: (ev: React.PointerEvent) => void;
    onPointerMove?: (ev: React.PointerEvent) => void;
  };

  const updatePlacement = React.useCallback((x: number, y: number) => {
    const el = tooltipRef.current;
    if (!el || typeof window === 'undefined') return;

    const rect = el.getBoundingClientRect();
    const next = computeFloatingPlacement(
      { x, y },
      { width: rect.width, height: rect.height },
      { width: window.innerWidth, height: window.innerHeight },
    );
    setPlacement(next);
    setReady(true);
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    updatePlacement(anchor.x, anchor.y);
  }, [open, anchor, content, updatePlacement]);

  const merged = React.cloneElement(child, {
    onPointerEnter: (e: React.PointerEvent) => {
      p.onPointerEnter?.(e);
      setAnchor({ x: e.clientX, y: e.clientY });
      setOpen(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      p.onPointerLeave?.(e);
      setOpen(false);
    },
    onPointerMove: (e: React.PointerEvent) => {
      p.onPointerMove?.(e);
      setAnchor({ x: e.clientX, y: e.clientY });
      if (open) {
        updatePlacement(e.clientX, e.clientY);
      }
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
            {content}
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
