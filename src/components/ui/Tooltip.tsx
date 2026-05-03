'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

/**
 * Shared surface for Kasparex tooltips (wallet dropdowns, form hints, etc.).
 * Import this when you need the same look outside Radix (rare); prefer `<Tooltip>`.
 */
export const KASPPAREX_TOOLTIP_SURFACE_CLASS =
  // Must sit above full-screen modals (some use z-[99999]).
  'z-[100000] max-w-xs rounded-lg bg-zinc-100 px-3 py-2.5 text-sm text-zinc-800 shadow-xl border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-600';

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
  /** @deprecated Position is ignored; tooltips follow the pointer. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** @deprecated Alignment is ignored; tooltips follow the pointer. */
  align?: 'start' | 'center' | 'end';
  className?: string;
}

function wrapChild(children: React.ReactNode): React.ReactElement {
  if (React.isValidElement(children)) return children;
  return <span className="inline-flex">{children}</span>;
}

/**
 * Hover tooltip that follows the cursor (pointer position), merged onto the child trigger.
 */
export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });

  const child = wrapChild(children);

  const p = child.props as {
    onPointerEnter?: (ev: React.PointerEvent) => void;
    onPointerLeave?: (ev: React.PointerEvent) => void;
    onPointerMove?: (ev: React.PointerEvent) => void;
  };

  const merged = React.cloneElement(child, {
    onPointerEnter: (e: React.PointerEvent) => {
      p.onPointerEnter?.(e);
      setOpen(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      p.onPointerLeave?.(e);
      setOpen(false);
    },
    onPointerMove: (e: React.PointerEvent) => {
      p.onPointerMove?.(e);
      setPos({ x: e.clientX, y: e.clientY });
    },
  } as Record<string, unknown>);

  const portal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="tooltip"
            className={`${KASPPAREX_TOOLTIP_SURFACE_CLASS} ${className}`.trim()}
            style={{
              position: 'fixed',
              left: pos.x + 18,
              top: pos.y + 18,
              pointerEvents: 'none',
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
