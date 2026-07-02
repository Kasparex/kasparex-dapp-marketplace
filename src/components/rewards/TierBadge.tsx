'use client';

import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { getKrexTierUi, krexTierBadgeClassName } from '@/lib/rewards/tierUi';

interface TierBadgeProps {
  tier: KREXTier;
  isUnlocked: boolean;
  className?: string;
}

export function TierBadge({ tier, isUnlocked, className = '' }: TierBadgeProps) {
  const tierConfig = KREX_TIERS[tier];
  const ui = getKrexTierUi(tier);

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${krexTierBadgeClassName(tier, isUnlocked)} ${className}`.trim()}
    >
      {isUnlocked ? (
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ) : null}
      <span>{ui.label !== 'No tier' ? ui.label : tierConfig.label}</span>
    </span>
  );
}
