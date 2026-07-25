'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

type PillSize = 'md' | 'sm';

/** Matches `KX_LISTING_CATEGORY_CHIP` shell; color comes from `styleClass`. */
const sizeClasses: Record<PillSize, string> = {
  md: 'rounded-lg border px-3 py-1.5 text-xs font-medium',
  sm: 'rounded-lg border px-2.5 py-1 text-[11px] font-medium',
};

/** Network / status chip with optional icon (icon omitted for Tokens network badges). */
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
  return (
    <Tooltip content={tooltip}>
      <span
        className={`inline-flex shrink-0 cursor-help items-center gap-1.5 whitespace-nowrap ${sizeClasses[size]} ${styleClass} ${className}`.trim()}
        aria-label={tooltip}
      >
        {icon ? <span className="inline-flex shrink-0 items-center justify-center opacity-80">{icon}</span> : null}
        <span>{label}</span>
      </span>
    </Tooltip>
  );
}
