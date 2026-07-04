'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

/** Tier-style pill badge with optional icon (matches Benefits module TierBadge). */
export function TokenListingPillBadge({
  label,
  tooltip,
  styleClass,
  icon,
  className = '',
}: {
  label: string;
  tooltip: string;
  styleClass: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip content={tooltip}>
      <span
        className={`inline-flex shrink-0 cursor-help items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide whitespace-nowrap ${styleClass} ${className}`.trim()}
        aria-label={tooltip}
      >
        {icon ? <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center">{icon}</span> : null}
        <span>{label}</span>
      </span>
    </Tooltip>
  );
}
