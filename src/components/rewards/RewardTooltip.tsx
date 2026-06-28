'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface RewardTooltipProps {
  description: string;
  children: React.ReactNode;
  /** When false, only `children` are shown (no extra trailing info glyph). */
  showTrailingIcon?: boolean;
}

export function RewardTooltip({ description, children, showTrailingIcon = true }: RewardTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTooltip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const padding = 16; // Padding from viewport edges
      const tooltipWidth = 280; // Approximate tooltip width
      const tooltipHeight = 80; // Approximate tooltip height
      const offset = 12; // Offset from cursor

      let left = e.clientX + offset;
      let top = e.clientY + offset;

      // Adjust horizontal position if tooltip would go off-screen
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = e.clientX - tooltipWidth - offset;
      }
      if (left < padding) {
        left = padding;
      }

      // Adjust vertical position if tooltip would go off-screen
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = e.clientY - tooltipHeight - offset;
      }
      if (top < padding) {
        top = padding;
      }

      setTooltipPosition({ top, left });
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove({ clientX: 0, clientY: 0 } as MouseEvent); // Initial position

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showTooltip]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => setShowTooltip(true)}
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

      {showTooltip && tooltipPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="fixed bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none max-w-xs"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <p className="kx-body text-zinc-700 dark:text-zinc-300">
            {description}
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
