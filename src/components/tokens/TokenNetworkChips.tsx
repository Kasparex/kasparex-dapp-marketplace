'use client';

import type { Token } from '@/lib/tokens/types';
import {
  getTokenNetworkEntries,
  getNetworkChipShortLabel,
  getNetworkChipStyleClasses,
  getNetworkChipTooltip,
  getFeaturedChipStyleClasses,
} from '@/lib/tokens/networks';
import { TokenListingPillBadge } from '@/components/tokens/TokenListingPillBadge';
import { FeaturedBadgeIcon, NetworkBadgeIcon } from '@/components/tokens/tokenNetworkBadgeIcons';

type TokenNetworkChipsProps = {
  token: Token;
  className?: string;
  /** When true, renders Featured pill alongside network badges (top section). */
  includeFeatured?: boolean;
  /** stack: column under verification badge. inline: horizontal row. */
  layout?: 'inline' | 'stack';
};

export function TokenNetworkChips({
  token,
  className = '',
  includeFeatured = false,
  layout = 'inline',
}: TokenNetworkChipsProps) {
  const entries = getTokenNetworkEntries(token);
  const showFeatured = includeFeatured && Boolean(token.listing?.featured);

  if (entries.length === 0 && !showFeatured) return null;

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
        />
      ))}
      {showFeatured ? (
        <TokenListingPillBadge
          label="Featured"
          tooltip="Premium featured listing"
          styleClass={getFeaturedChipStyleClasses()}
          icon={<FeaturedBadgeIcon />}
        />
      ) : null}
    </div>
  );
}
