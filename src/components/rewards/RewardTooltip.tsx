'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { KASPPAREX_TOOLTIP_SURFACE_CLASS } from '@/components/ui/Tooltip';
import { computeFloatingPlacement } from '@/lib/ui/floatingPosition';

interface RewardTooltipProps {
  description: string;
  children: React.ReactNode;
  /** When false, only `children` are shown (no extra trailing info glyph). */
  showTrailingIcon?: boolean;
}

export function RewardTooltip({ description, children, showTrailingIcon = true }: RewardTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0 });
  const [placement, setPlacement] = useState({ left: 0, top: 0 });
  const [ready, setReady] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePlacement = useCallback((x: number, y: number) => {
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

  useLayoutEffect(() => {
    if (!showTooltip) {
      setReady(false);
      return;
    }
    updatePlacement(anchor.x, anchor.y);
  }, [showTooltip, anchor, description, updatePlacement]);

  useEffect(() => {
    if (!showTooltip) return;

    const handleMouseMove = (e: MouseEvent) => {
      setAnchor({ x: e.clientX, y: e.clientY });
      updatePlacement(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showTooltip, updatePlacement]);

  return (
    <>
      <div
        onMouseEnter={(e) => {
          setAnchor({ x: e.clientX, y: e.clientY });
          setShowTooltip(true);
        }}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 cursor-help"
      >
        {children}
        {showTrailingIcon ? (
          <svg
            className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : null}
      </div>

      {showTooltip && typeof window !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className={`${KASPPAREX_TOOLTIP_SURFACE_CLASS} pointer-events-none`}
          style={{
            position: 'fixed',
            top: placement.top,
            left: placement.left,
            visibility: ready ? 'visible' : 'hidden',
          }}
        >
          <p className="kx-body text-zinc-700 dark:text-zinc-300">{description}</p>
        </div>,
        document.body,
      )}
    </>
  );
}
