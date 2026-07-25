'use client';

import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

type PillSize = 'md' | 'sm';

/** Previous solid-pill look with current rounded-lg corners. */
const sizeClasses: Record<PillSize, string> = {
  md: 'rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
  sm: 'rounded-lg px-1.5 py-px text-[9px] font-black uppercase tracking-wide',
};

/** Network / status pill badge with optional icon. */
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
        className={`inline-flex shrink-0 cursor-help items-center gap-1 whitespace-nowrap ${sizeClasses[size]} ${styleClass} ${className}`.trim()}
        aria-label={tooltip}
      >
        {icon ? <span className="inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center">{icon}</span> : null}
        <span>{label}</span>
      </span>
    </Tooltip>
  );
}
