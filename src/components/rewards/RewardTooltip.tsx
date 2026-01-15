'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface RewardTooltipProps {
  description: string;
  children: React.ReactNode;
}

export function RewardTooltip({ description, children }: RewardTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTooltip || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Position tooltip above the element, centered
      const top = rect.top + scrollY - 8;
      const left = rect.left + scrollX + rect.width / 2;

      setTooltipPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
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
      </div>

      {showTooltip && tooltipPosition && typeof window !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          className="fixed bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none max-w-xs"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            marginTop: '-8px',
          }}
        >
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {description}
          </p>
        </div>,
        document.body
      )}
    </>
  );
}
