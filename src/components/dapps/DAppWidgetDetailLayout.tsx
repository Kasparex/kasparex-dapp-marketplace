'use client';

import type { ReactNode } from 'react';

/** Widget tab main column: form panel only (calculation breakdown lives in the right sidebar). */
export function DAppWidgetDetailLayout({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
