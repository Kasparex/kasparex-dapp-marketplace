'use client';

import type { Token } from '@/lib/tokens/types';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';

function VerifiedIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function UtilityIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function FeaturedIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function TokenVerifiedBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-black uppercase tracking-wide text-[#02abb8] dark:text-[#66dfe8] bg-[#02abb8]/10 border border-[#02abb8]/25 ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      title="Verified project"
    >
      <VerifiedIcon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {compact ? 'Verified' : 'Verified'}
    </span>
  );
}

export function TokenUtilityBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      title="Instant utility enabled in Kasparex Hub"
    >
      <UtilityIcon />
      {compact ? 'Utility' : 'Utility Enabled'}
    </span>
  );
}

export function TokenFeaturedBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-black uppercase tracking-wide text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/25 ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      title="Premium featured listing"
    >
      <FeaturedIcon />
      Featured
    </span>
  );
}

export function TokenListingBadges({
  token,
  compact,
  showUtilityChips = true,
}: {
  token: Token;
  compact?: boolean;
  showUtilityChips?: boolean;
}) {
  const listing = token.listing;
  if (!listing) return null;

  const hasBadges =
    listing.verified ||
    listing.instantUtility ||
    listing.featured ||
    (showUtilityChips && listing.utilityBadges && listing.utilityBadges.length > 0);

  if (!hasBadges) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? '' : 'mt-1.5'}`}>
      {listing.verified ? <TokenVerifiedBadge compact={compact} /> : null}
      {listing.instantUtility ? <TokenUtilityBadge compact={compact} /> : null}
      {listing.featured ? <TokenFeaturedBadge compact={compact} /> : null}
      {showUtilityChips && listing.utilityBadges?.map((badge) => (
        <KxListingCategoryChip key={badge}>{badge}</KxListingCategoryChip>
      ))}
    </div>
  );
}

export function tokenRowHighlightClass(token: Token): string {
  if (token.listing?.featured) {
    return 'bg-amber-50/50 dark:bg-amber-950/20 border-l-2 border-l-amber-400';
  }
  if (token.listing?.instantUtility) {
    return 'bg-emerald-50/30 dark:bg-emerald-950/10';
  }
  return '';
}
