'use client';

import type { ReactNode } from 'react';

/** Bottom-of-container alert stack. Place at the end of a form or panel. */
export function KxAlertRegion({ children, className }: { children: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <div
      className={`kx-alert-region mt-4 space-y-2 pt-3 ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      {children}
    </div>
  );
}
