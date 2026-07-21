'use client';

import { HubNetworkBadge } from '@/components/hub/HubNetworkBadge';
import type { HubNetworkBadgeConfig } from '@/lib/hub/access';
import type { GameCapability } from '@/lib/games/registry';

/** Resolve network badge from game capabilities (default L1 Kaspa). */
export function resolveGameNetworkBadge(capabilities?: GameCapability[]): HubNetworkBadgeConfig {
  const caps = capabilities ?? [];
  const hasL2 = caps.some((c) => c === 'payments_krc20_krex');
  const hasL1 = caps.some((c) => c === 'wallet_l1' || c === 'payments_l1_kas') || caps.length === 0;
  if (hasL1 && hasL2) {
    return { layer: 'either', label: 'Kaspa' };
  }
  if (hasL2 && !hasL1) {
    return { layer: 'L2', label: 'Kaspa L2' };
  }
  return { layer: 'L1', label: 'Kaspa' };
}

export function GameNetworkBadge({
  capabilities,
  size = 'sm',
  className = '',
  compact = false,
}: {
  capabilities?: GameCapability[];
  size?: 'sm' | 'md';
  className?: string;
  /** Show only L1 / L2 / L1/L2 (listing cards). */
  compact?: boolean;
}) {
  return (
    <HubNetworkBadge
      badge={resolveGameNetworkBadge(capabilities)}
      size={size}
      className={className}
      compact={compact}
    />
  );
}
