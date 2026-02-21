'use client';

import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';

interface TierBadgeProps {
  tier: KREXTier;
  isUnlocked: boolean;
}

const TIER_BORDER: Record<string, string> = {
  Tier0: 'border-zinc-400 dark:border-zinc-500',
  Tier1: 'border-blue-500 dark:border-blue-400',
  Tier2: 'border-green-500 dark:border-green-400',
  Tier3: 'border-purple-500 dark:border-purple-400',
  Tier4: 'border-amber-500 dark:border-amber-400',
};

export function TierBadge({ tier, isUnlocked }: TierBadgeProps) {
  const tierConfig = KREX_TIERS[tier];
  const tierColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
    Tier0: {
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      darkBg: 'dark:bg-zinc-800',
      darkText: 'dark:text-zinc-400',
    },
    Tier1: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      darkBg: 'dark:bg-blue-900/30',
      darkText: 'dark:text-blue-300',
    },
    Tier2: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      darkBg: 'dark:bg-green-900/30',
      darkText: 'dark:text-green-300',
    },
    Tier3: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      darkBg: 'dark:bg-purple-900/30',
      darkText: 'dark:text-purple-300',
    },
    Tier4: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      darkBg: 'dark:bg-amber-900/30',
      darkText: 'dark:text-amber-300',
    },
  };
  const colors = tierColors[tier] ?? tierColors.Tier0;
  const borderClass = TIER_BORDER[tier] ?? TIER_BORDER.Tier0;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all border ${isUnlocked
        ? `${colors.bg} ${colors.text} shadow-sm ${borderClass}`
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 opacity-60 border-zinc-300 dark:border-zinc-600'
      }`}>
      {isUnlocked && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      )}
      <span>{tierConfig.label}</span>
    </div>
  );
}
