'use client';

import type { Token } from '@/lib/tokens/types';
import {
  getTokenNetworkEntries,
  getNetworkChipShortLabel,
  getNetworkChipStyleClasses,
  getNetworkChipTooltip,
} from '@/lib/tokens/networks';
import { TokenListingPillBadge } from '@/components/tokens/TokenListingPillBadge';
import { NetworkBadgeIcon } from '@/components/tokens/tokenNetworkBadgeIcons';

type TokenNetworkChipsProps = {
  token: Token;
  className?: string;
  /** stack: column under verification badge. inline: horizontal row. */
  layout?: 'inline' | 'stack';
};

export function TokenNetworkChips({
  token,
  className = '',
  layout = 'inline',
}: TokenNetworkChipsProps) {
  const entries = getTokenNetworkEntries(token);
  if (entries.length === 0) return null;

  const layoutClass =
    layout === 'stack'
      ? 'flex flex-wrap items-end justify-end gap-1'
      : 'flex flex-wrap items-center gap-1';

  return (
    <div className={`${layoutClass} ${className}`.trim()}>
      {entries.map((entry) => (
        <TokenListingPillBadge
          key={`${entry.network}-${entry.contractAddress ?? 'none'}`}
          label={getNetworkChipShortLabel(entry.network)}
          tooltip={getNetworkChipTooltip(entry.network, entry)}
          styleClass={getNetworkChipStyleClasses(entry.network)}
          icon={<NetworkBadgeIcon network={entry.network} />}
          size="sm"
        />
      ))}
    </div>
  );
}
