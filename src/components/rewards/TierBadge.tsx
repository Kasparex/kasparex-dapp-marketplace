'use client';

import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';

interface TierBadgeProps {
  tier: KREXTier;
  isUnlocked: boolean;
}

export function TierBadge({ tier, isUnlocked }: TierBadgeProps) {
  const tierConfig = KREX_TIERS[tier];
  const tierColors: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
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
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      darkBg: 'dark:bg-yellow-900/30',
      darkText: 'dark:text-yellow-300',
    },
  };
  const colors = tierColors[tier] || tierColors.Tier1;
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${
      isUnlocked 
        ? `${colors.bg} ${colors.text}` 
        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
    }`}>
      {tierConfig.label}
    </span>
  );
}
