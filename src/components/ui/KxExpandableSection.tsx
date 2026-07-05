'use client';

import { useState, type ReactNode } from 'react';

export interface KxExpandableSectionProps {
  children: ReactNode;
  /** Max height in px before collapsing on mobile. */
  collapsedMaxHeight?: number;
  expandLabel?: string;
  collapseLabel?: string;
  className?: string;
  /** Only collapse below this breakpoint (default: mobile). */
  mobileOnly?: boolean;
}

/**
 * Collapses tall content on small screens with a View More toggle.
 */
export function KxExpandableSection({
  children,
  collapsedMaxHeight = 280,
  expandLabel = 'View More',
  collapseLabel = 'View Less',
  className = '',
  mobileOnly = true,
}: KxExpandableSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <div
        className={
          expanded
            ? ''
            : mobileOnly
              ? 'max-h-[var(--kx-expand-max)] overflow-hidden md:max-h-none md:overflow-visible'
              : 'max-h-[var(--kx-expand-max)] overflow-hidden'
        }
        style={{ ['--kx-expand-max' as string]: `${collapsedMaxHeight}px` }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={`mt-2 text-sm font-medium text-[#02abb8] hover:text-[#02919c] transition-colors ${
          mobileOnly ? 'md:hidden' : ''
        }`.trim()}
        aria-expanded={expanded}
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    </div>
  );
}
