'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { computeFloatingPlacement } from '@/lib/ui/floatingPosition';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';

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

/**
 * Desktop: hover tooltip following the cursor.
 * Mobile: tap to toggle open/closed.
 */
export function Tooltip({ content, children, className = '' }: TooltipProps) {
  const isMobile = useIsMobileViewport();
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState({ x: 0, y: 0 });
  const [placement, setPlacement] = React.useState({ left: 0, top: 0 });
  const [ready, setReady] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef(content);

  contentRef.current = content;

  const child = wrapChild(children);

  const p = child.props as {
    onPointerEnter?: (ev: React.PointerEvent) => void;
    onPointerLeave?: (ev: React.PointerEvent) => void;
    onPointerMove?: (ev: React.PointerEvent) => void;
    onClick?: (ev: React.MouseEvent) => void;
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
    setPlacement((prev) => (prev.left === next.left && prev.top === next.top ? prev : next));
    setReady(true);
  }, []);

  const setAnchorFromElement = React.useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setAnchor({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    updatePlacement(anchor.x, anchor.y);
  }, [open, anchor.x, anchor.y, updatePlacement]);

  React.useEffect(() => {
    if (!isMobile || !open) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      const target = e.target as Node;
      if (trigger?.contains(target) || tooltip?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [isMobile, open]);

  const merged = React.cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (child as React.ReactElement & { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onClick: (e: React.MouseEvent) => {
      p.onClick?.(e);
      if (!isMobile) return;
      const el = e.currentTarget as HTMLElement;
      setAnchorFromElement(el);
      setOpen((v) => !v);
    },
    onPointerEnter: (e: React.PointerEvent) => {
      p.onPointerEnter?.(e);
      if (isMobile || e.pointerType === 'touch') return;
      setAnchor({ x: e.clientX, y: e.clientY });
      setOpen(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      p.onPointerLeave?.(e);
      if (isMobile || e.pointerType === 'touch') return;
      setOpen(false);
    },
    onPointerMove: (e: React.PointerEvent) => {
      p.onPointerMove?.(e);
      if (isMobile || e.pointerType === 'touch') return;
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
              pointerEvents: isMobile ? 'auto' : 'none',
              visibility: ready ? 'visible' : 'hidden',
            }}
            onClick={(e) => {
              if (isMobile) e.stopPropagation();
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
