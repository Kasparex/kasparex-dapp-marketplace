import type { KREXTier } from '@/lib/rewards/types';

/** Visual tier keys used across Benefits panels and tier badges. */
export type KrexPerkVisualTier = 'none' | 'starter' | 'builder' | 'pro' | 'vip';

export type KrexTierUi = {
  label: string;
  panel: string;
  status: string;
  statusText: string;
  accent: string;
  badge: string;
};

export const KREX_TIER_UI: Record<KrexPerkVisualTier, KrexTierUi> = {
  none: {
    label: 'No tier',
    panel:
      'border-zinc-300/80 bg-gradient-to-br from-zinc-100 via-white to-zinc-200/80 dark:border-zinc-500/35 dark:from-zinc-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-zinc-300/80 bg-zinc-100 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300',
    statusText: 'Base Hub Points on earn actions. Hold 1M+ KREX for fee discounts and multipliers.',
    accent: 'text-zinc-500 dark:text-zinc-400',
    badge: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200',
  },
  starter: {
    label: 'Tier 1',
    panel:
      'border-orange-300/80 bg-gradient-to-br from-orange-50 via-white to-orange-100/70 dark:border-orange-400/35 dark:from-orange-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-orange-300/80 bg-orange-50 text-orange-900 dark:border-orange-400/30 dark:bg-orange-500/10 dark:text-orange-100',
    statusText: '1M+ KREX. 5% off fees and 1x Hub Points on earn actions.',
    accent: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
  },
  builder: {
    label: 'Tier 2',
    panel:
      'border-yellow-300/80 bg-gradient-to-br from-yellow-50 via-white to-amber-100/70 dark:border-yellow-400/35 dark:from-yellow-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-yellow-300/80 bg-yellow-50 text-yellow-900 dark:border-yellow-400/30 dark:bg-yellow-500/10 dark:text-yellow-100',
    statusText: '10M+ KREX. 10% off fees and 2x Hub Points.',
    accent: 'text-yellow-700 dark:text-yellow-400',
    badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200',
  },
  pro: {
    label: 'Tier 3',
    panel:
      'border-teal-300/80 bg-gradient-to-br from-teal-50 via-white to-cyan-100/70 dark:border-teal-400/35 dark:from-teal-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-teal-300/80 bg-teal-50 text-teal-900 dark:border-teal-400/30 dark:bg-teal-500/10 dark:text-teal-100',
    statusText: '50M+ KREX. 50% off fees and 3x Hub Points.',
    accent: 'text-teal-700 dark:text-teal-400',
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-200',
  },
  vip: {
    label: 'Tier 4',
    panel:
      'border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-teal-100/70 dark:border-emerald-400/35 dark:from-emerald-500/10 dark:via-zinc-900 dark:to-zinc-800/40',
    status: 'border-emerald-300/80 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100',
    statusText: '100M+ KREX. 80% off fees and 4x Hub Points.',
    accent: 'text-emerald-700 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
};

const TIER_TO_VISUAL: Record<KREXTier, KrexPerkVisualTier> = {
  Tier0: 'none',
  Tier1: 'starter',
  Tier2: 'builder',
  Tier3: 'pro',
  Tier4: 'vip',
};

export function balanceToKrexVisualTier(balance: number): KrexPerkVisualTier {
  if (balance < 1_000_000) return 'none';
  if (balance < 10_000_000) return 'starter';
  if (balance < 50_000_000) return 'builder';
  if (balance < 100_000_000) return 'pro';
  return 'vip';
}

export function krexTierToVisualTier(tier: KREXTier): KrexPerkVisualTier {
  return TIER_TO_VISUAL[tier];
}

export function getKrexTierUi(tier: KREXTier): KrexTierUi {
  return KREX_TIER_UI[krexTierToVisualTier(tier)];
}

export function getKrexTierUiFromBalance(balance: number): KrexTierUi {
  return KREX_TIER_UI[balanceToKrexVisualTier(balance)];
}

/** Shared pill classes for tier badges (Benefits module standard). */
export function krexTierBadgeClassName(tier: KREXTier, isUnlocked = true): string {
  const ui = getKrexTierUi(tier);
  const base = `rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${ui.badge}`;
  return isUnlocked ? base : `${base} opacity-50`;
}
