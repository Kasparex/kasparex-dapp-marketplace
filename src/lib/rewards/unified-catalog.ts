/**
 * Unified catalog for Kasparex Hub rewards (/rewards). Extends legacy redeem catalog semantics.
 */

import type { RedeemItemId } from '@/lib/redeem/catalog';
import {
  MINECORE_GRID_PER_REFINEMENT_POINT,
  MINECORE_KREX_PER_REFINEMENT_POINT,
} from '@/lib/game/minecore/config';

export type RewardCatalogKind = 'token_pool' | 'perk' | 'badge' | 'coupon' | 'partner_pool';

export type RewardFulfillment = 'l2_contract' | 'local_mvp' | 'coming_soon';

/** Token pool: points spent × rate = payout preview (Minecore-aligned rates). */
export type TokenPoolRate = {
  payoutSymbol: 'GRID' | 'KREX';
  /** Whole tokens credited per 1 redeemable point spent. */
  tokensPerPoint: number;
};

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
  /**
   * For non-token-pool rows: redeemable points per catalog unit × quantity selector.
   * For token pools: use 1 (points selector is literal points to spend).
   */
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
  /** Set for `kind: 'token_pool'`: payout rate shown on cards and Claim CTA math. */
  tokenPoolRate?: TokenPoolRate;
};

export function isTokenPoolClaimItem(it: UnifiedRewardItem): boolean {
  return it.kind === 'token_pool' && it.tokenPoolRate != null && it.fulfillment !== 'coming_soon';
}

export const UNIFIED_REWARD_CATALOG: UnifiedRewardItem[] = [
  {
    id: 'fee_discount_1',
    kind: 'coupon',
    title: '1% Fee discount coupon',
    category: 'Coupon',
    description: 'Supported dApp fee discount. Logged locally in MVP.',
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
    description: 'Hub comment gates. Stored locally until accounts ship.',
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
    description: 'Profile badge via backend wiring. Seasonal pricing.',
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
    description: 'Convert redeemable points into GRID at the catalog rate.',
    icon: '⬡',
    costPointsPerUnit: 1,
    minQty: 1,
    maxQty: 1,
    fulfillment: 'l2_contract',
    tokenPoolRate: {
      payoutSymbol: 'GRID',
      tokensPerPoint: MINECORE_GRID_PER_REFINEMENT_POINT,
    },
  },
  {
    id: 'pool_krex_claim',
    kind: 'token_pool',
    title: 'KREX pool distribution',
    category: 'Token pool',
    description: 'Convert redeemable points into KREX at the catalog rate.',
    icon: '◎',
    costPointsPerUnit: 1,
    minQty: 1,
    maxQty: 1,
    fulfillment: 'l2_contract',
    tokenPoolRate: {
      payoutSymbol: 'KREX',
      tokensPerPoint: MINECORE_KREX_PER_REFINEMENT_POINT,
    },
  },
  {
    id: 'partner_bonus_pool',
    kind: 'partner_pool',
    title: 'Partner reward pool placeholder',
    category: 'Partner pool',
    description: 'Cross-project drops. Not claimable yet.',
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
