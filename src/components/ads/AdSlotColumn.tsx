'use client';

import type { ReactNode } from 'react';

/**
 * Wraps in-page ad grids so carousel shells stay within the column (min-w-0 / overflow).
 * Use beside rails, article asides, footer strip, etc.
 */
export function AdSlotColumn({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`w-full min-w-0 max-w-full overflow-hidden ${className}`.trim()}>{children}</div>;
}
