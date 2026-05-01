'use client';

import type { ReactNode } from 'react';

/**
 * Match Minecore Owned Assets / Assigned Workers capsule tooltips: bold title + details.
 */
export function gameTooltipRich(title: string, description: ReactNode): ReactNode {
  return (
    <div className="space-y-2">
      <p className="font-semibold">{title}</p>
      <div className="text-xs opacity-90">{description}</div>
    </div>
  );
}
