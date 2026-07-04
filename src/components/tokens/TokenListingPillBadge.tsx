'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

type PillSize = 'md' | 'sm';

const sizeClasses: Record<PillSize, { pill: string; icon: string }> = {
  md: {
    pill: 'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
    icon: 'h-3 w-3',
  },
  sm: {
    pill: 'rounded px-1.5 py-px text-[9px] font-black uppercase tracking-wide',
    icon: 'h-2.5 w-2.5',
  },
};

/** Tier-style pill badge with optional icon (matches Benefits module TierBadge). */
export function TokenListingPillBadge({
  label,
  tooltip,
  styleClass,
  icon,
  size = 'md',
  className = '',
}: {
  label: string;
  tooltip: string;
  styleClass: string;
  icon?: ReactNode;
  size?: PillSize;
  className?: string;
}) {
  const sizing = sizeClasses[size];

  return (
    <Tooltip content={tooltip}>
      <span
        className={`inline-flex shrink-0 cursor-help items-center gap-1 whitespace-nowrap ${sizing.pill} ${styleClass} ${className}`.trim()}
        aria-label={tooltip}
      >
        {icon ? (
          <span className={`inline-flex shrink-0 items-center justify-center ${sizing.icon}`}>{icon}</span>
        ) : null}
        <span>{label}</span>
      </span>
    </Tooltip>
  );
}
