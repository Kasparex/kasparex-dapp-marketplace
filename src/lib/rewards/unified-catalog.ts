/**
 * Unified catalog for Kasparex Hub rewards (/rewards). Extends legacy redeem catalog semantics.
 */

import type { RedeemItemId } from '@/lib/redeem/catalog';

export type RewardCatalogKind = 'token_pool' | 'perk' | 'badge' | 'coupon' | 'partner_pool';

export type RewardFulfillment = 'l2_contract' | 'local_mvp' | 'coming_soon';

export type UnifiedRewardItem = {
  id: string;
  kind: RewardCatalogKind;
  title: string;
  /** Short capsule label shown on Media overlay (passed to GameItemCard category prop). */
  category: string;
  description: string;
  imageSrc?: string;
  /** Emoji fallback when no image. */
  icon?: string;
  costPointsPerUnit: number;
  minQty: number;
  maxQty: number;
  fulfillment: RewardFulfillment;
  /**
   * When `l2_contract`, user txs may require admin-controlled RewardManager callers.
   * UI records locally regardless until real user-facing ABI exists.
   */
  fulfillmentNotes?: string;
  /** Minecore-style blueprint rows under description. */
  effects?: Array<{ label: string; value: string }>;
};

export const UNIFIED_REWARD_CATALOG: UnifiedRewardItem[] = [
  {
    id: 'fee_discount_1',
    kind: 'coupon',
    title: '1% Fee discount coupon',
    category: 'Coupon',
    description: 'Coupon for supported dApps ecosystem fees once fulfillment is centralized. MVP records redemption locally.',
    icon: '🎟️',
    costPointsPerUnit: 250,
    minQty: 1,
    maxQty: 10,
    fulfillment: 'local_mvp',
  },
  {
    id: 'comment_credits_10',
    kind: 'perk',
    title: '10 comment credits',
    category: 'Perk',
    description: 'Credits for Hub experiences that gate comments. Stored locally until account backend attaches entitlements.',
    icon: '💬',
    costPointsPerUnit: 120,
    minQty: 1,
    maxQty: 20,
    fulfillment: 'local_mvp',
  },
  {
    id: 'badge_founder',
    kind: 'badge',
    title: 'Founder badge (seasonal)',
    category: 'Badge',
    description: 'Profile badge unlocked after backend wiring. Costs reflect seasonal catalog pricing.',
    icon: '🛡️',
    costPointsPerUnit: 500,
    minQty: 1,
    maxQty: 1,
    fulfillment: 'local_mvp',
  },
  {
    id: 'pool_grid_claim',
    kind: 'token_pool',
    title: 'GRID pool distribution',
    category: 'Token pool',
    description: 'Redeem refinement-style points toward GRID pool payouts. Contract path targets IGRA Mainnet RewardManager routing when hub flags enable real claims.',
    icon: '⬡',
    costPointsPerUnit: 1000,
    minQty: 1,
    maxQty: 5,
    fulfillment: 'l2_contract',
    fulfillmentNotes: 'L2 RewardManager payouts are signer-gated today. Kasparex logs your intent locally and hides on-chain sends until routes are finalized.',
    effects: [
      { label: 'Network preference', value: 'IGRA Mainnet' },
      { label: 'Status', value: 'Feature-flagged payout path' },
    ],
  },
  {
    id: 'pool_krex_claim',
    kind: 'token_pool',
    title: 'KREX pool distribution',
    category: 'Token pool',
    description: 'Pool allocation toward KREX ecosystem emissions. Mirrors Minecore payout mental model.',
    icon: '◎',
    costPointsPerUnit: 1000,
    minQty: 1,
    maxQty: 5,
    fulfillment: 'l2_contract',
    fulfillmentNotes: 'Same constraints as GRID pools: local accounting now, guarded L2 send later.',
    effects: [
      { label: 'Network preference', value: 'IGRA Mainnet' },
      { label: 'Status', value: 'Coming online with vault wiring' },
    ],
  },
  {
    id: 'partner_bonus_pool',
    kind: 'partner_pool',
    title: 'Partner reward pool placeholder',
    category: 'Partner pool',
    description: 'Reserve for cross-project drops. Not yet claimable while partner contracts are configured.',
    icon: '🤝',
    costPointsPerUnit: 750,
    minQty: 1,
    maxQty: 3,
    fulfillment: 'coming_soon',
  },
];

/** Map legacy redeem catalog ids onto unified ids (1:1). */
export type LegacyRedeemCatalogId = RedeemItemId;

export function isLegacyCatalogId(id: string): id is LegacyRedeemCatalogId {
  return id === 'fee_discount_1' || id === 'badge_founder' || id === 'comment_credits_10';
}
