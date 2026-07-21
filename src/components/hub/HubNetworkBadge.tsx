'use client';

import type { HubNetworkBadgeConfig } from '@/lib/hub/access';
import { getDAppNetworkBadgeClassName } from '@/hooks/useDAppNetworkBadge';
import { hubLayerToBadgeKind } from '@/lib/hub/access';

export function HubNetworkBadge({
  badge,
  size = 'md',
  className = '',
  /** Layer only (L1 / L2 / L1/L2). No wifi icon or network name. */
  compact = false,
}: {
  badge: HubNetworkBadgeConfig;
  size?: 'sm' | 'md';
  className?: string;
  compact?: boolean;
}) {
  const kind = hubLayerToBadgeKind(badge.layer, badge.label, badge.testnet);
  const badgeClassName = getDAppNetworkBadgeClassName(kind);
  const sizeClass = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs';
  const layerLabel = badge.layer === 'either' ? 'L1/L2' : badge.layer;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center font-semibold rounded-lg shadow-sm ${sizeClass} ${badgeClassName} ${className}`}
      >
        {layerLabel}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-lg shadow-sm ${sizeClass} ${badgeClassName} ${className}`}
    >
      {layerLabel}
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
      </svg>
      {badge.label}
    </span>
  );
}
