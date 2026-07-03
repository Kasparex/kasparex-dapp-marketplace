/**
 * Token page module catalog (stub for Phase 2+).
 * Premium modules unlock via KAS/KREX with KREX tier discounts.
 */

import type { KREXTier } from '@/lib/rewards/types';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';

export type TokenModuleId =
  | 'roadmap_editor'
  | 'timeline_builder'
  | 'voting_module'
  | 'on_chain_poll'
  | 'utility_integrations'
  | 'premium_analytics'
  | 'featured_listing'
  | 'highlighted_profile';

export type TokenModuleOffer = {
  id: TokenModuleId;
  title: string;
  description: string;
  unlockPriceKas: number;
  featuredImage?: string;
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
    id: 'voting_module',
    title: 'Community Voting',
    description: 'Let holders vote on proposals and listing signals.',
    unlockPriceKas: 12,
  },
  {
    id: 'on_chain_poll',
    title: 'On-Chain Poll',
    description: 'Verified polls settled on Kaspa L1 or L2.',
    unlockPriceKas: 25,
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
];

export function getTokenModuleDiscountPercent(tier: KREXTier): number {
  return krexTierDiscountPercent(tier);
}

export function getTokenModuleOffer(id: TokenModuleId): TokenModuleOffer | undefined {
  return TOKEN_MODULE_OFFERS.find((offer) => offer.id === id);
}
