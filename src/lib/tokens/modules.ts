/**
 * Token page module catalog and entitlements (Phase 3 UaaS).
 * Premium modules unlock via KAS/KREX with KREX tier discounts.
 */

import type { KREXTier } from '@/lib/rewards/types';
import type { HubUtilityProductId } from './utilityRegistry';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { kasToKrexAmount, type StorePaymentCurrency } from '@/lib/store/currencies';

export type TokenModuleId =
  | 'roadmap_editor'
  | 'timeline_builder'
  | 'utility_integrations'
  | 'premium_analytics'
  | 'featured_listing'
  | 'highlighted_profile'
  | 'on_chain_poll';

export type TokenPollConfig = {
  question: string;
  options: string[];
  /** When true, voters can attach an optional on-chain tx hash as proof. */
  onChainEnabled?: boolean;
};

export type TokenRoadmapMilestone = {
  date: string;
  title: string;
  description: string;
  status?: 'completed' | 'in-progress' | 'upcoming';
};

export type TokenMarketVenueType = 'cex' | 'dex';

export type TokenMarketEntry = {
  name: string;
  description: string;
  url: string;
  venueType: TokenMarketVenueType;
};

export type TokenModulesConfig = {
  roadmap?: TokenRoadmapMilestone[];
  roadmapIntro?: string;
  roadmapOutro?: string;
  markets?: TokenMarketEntry[];
  poll?: TokenPollConfig;
  utilityProducts?: HubUtilityProductId[];
};

export type TokenModuleOffer = {
  id: TokenModuleId;
  title: string;
  description: string;
  unlockPriceKas: number;
  featuredImage?: string;
};

export type TokenModuleAddonLine = {
  id: TokenModuleId;
  title: string;
  kas: number;
};

export const TOKEN_MODULE_OFFERS: TokenModuleOffer[] = [
  {
    id: 'roadmap_editor',
    title: 'Roadmap Module',
    description: 'Add a visual roadmap timeline to your token landing page.',
    unlockPriceKas: 20,
  },
  {
    id: 'timeline_builder',
    title: 'Timeline Builder',
    description: 'Drag-and-drop milestone editor with status tracking.',
    unlockPriceKas: 15,
  },
  {
    id: 'utility_integrations',
    title: 'Hub Utility Integrations',
    description: 'Connect your token to Kasparex payments, swaps, and dApp tools.',
    unlockPriceKas: 30,
  },
  {
    id: 'premium_analytics',
    title: 'Premium Analytics',
    description: 'Holder stats, activity trends, and utility usage dashboards.',
    unlockPriceKas: 18,
  },
  {
    id: 'featured_listing',
    title: 'Featured Listing',
    description: 'Highlighted placement on the Kasparex Tokens directory.',
    unlockPriceKas: 35,
  },
  {
    id: 'highlighted_profile',
    title: 'Highlighted Profile',
    description: 'Premium halo styling and badge placement on your token page.',
    unlockPriceKas: 22,
  },
  {
    id: 'on_chain_poll',
    title: 'Community Poll',
    description: 'Run a community poll on your token page with optional on-chain vote proof.',
    unlockPriceKas: 12,
  },
];

export function getTokenModuleDiscountPercent(tier: KREXTier): number {
  return krexTierDiscountPercent(tier);
}

export function getTokenModuleEffectivePriceKas(baseKas: number, tier: KREXTier): number {
  const discount = getTokenModuleDiscountPercent(tier);
  const factor = 1 - discount / 100;
  return Math.max(0.01, Math.round(baseKas * factor * 100) / 100);
}

export function getTokenModuleOffer(id: TokenModuleId): TokenModuleOffer | undefined {
  return TOKEN_MODULE_OFFERS.find((offer) => offer.id === id);
}

export function computeTokenModuleAddonKas(
  moduleIds: TokenModuleId[],
  tier: KREXTier,
  excludeModuleIds: TokenModuleId[] = [],
): { totalKas: number; lines: TokenModuleAddonLine[] } {
  const exclude = new Set(excludeModuleIds);
  const lines: TokenModuleAddonLine[] = moduleIds
    .filter((id) => !exclude.has(id))
    .map((id) => {
      const offer = getTokenModuleOffer(id);
      const base = offer?.unlockPriceKas ?? 0;
      return {
        id,
        title: offer?.title ?? id.replace(/_/g, ' '),
        kas: getTokenModuleEffectivePriceKas(base, tier),
      };
    });
  const totalKas = Math.round(lines.reduce((sum, line) => sum + line.kas, 0) * 100) / 100;
  return { totalKas, lines };
}

export function formatTokenModulePaymentLabel(currency: StorePaymentCurrency, kasAmount: number): string {
  if (currency === 'KREX') {
    return `${kasToKrexAmount(kasAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })} KREX`;
  }
  const formatted =
    Number.isInteger(kasAmount) ? `${kasAmount}` : kasAmount.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted} KAS`;
}

export function defaultTokenPollConfig(): TokenPollConfig {
  return {
    question: 'What should we prioritize next?',
    options: ['More utility', 'Marketing push', 'Exchange listings'],
    onChainEnabled: false,
  };
}

export function cleanPollOptions(options: string[]): string[] {
  return options.map((o) => o.trim()).filter(Boolean).slice(0, 10);
}

export function tokenHasModule(paidModuleIds: TokenModuleId[] | undefined, id: TokenModuleId): boolean {
  return (paidModuleIds ?? []).includes(id);
}
