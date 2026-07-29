import type { NFTStatus } from '@/lib/rewards/types';
import type { KREXTier } from '@/lib/rewards/types';
import { getVBlogPlatformFeeBps } from '@/lib/vblog/config';
import { getVBlogModuleCombinedDiscountPercent } from '@/lib/vblog/modules';

/**
 * KIP-9 dust / storage-mass floor. Outputs below ~0.019 KAS are rejected;
 * use 0.02 as a safe Hub minimum for reader split legs.
 */
export const VBLOG_READER_MIN_OUTPUT_KAS = 0.02;

/** Reader-facing unlock price after KREX / NFT holder discounts. */
export function getVBlogReaderUnlockPriceKas(
  baseKas: number,
  tier: KREXTier,
  nft?: NFTStatus | null,
): number {
  if (!Number.isFinite(baseKas) || baseKas <= 0) return 0;
  const discount = getVBlogModuleCombinedDiscountPercent(tier, nft ?? null);
  const factor = 1 - discount / 100;
  return Math.max(VBLOG_READER_MIN_OUTPUT_KAS, Math.round(baseKas * factor * 100) / 100);
}

export type VBlogReaderPaymentSplit = {
  totalKas: number;
  platformKas: number;
  authorKas: number;
  discountPercent: number;
  listKas: number;
};

/** Split a reader payment between author payout(s) and platform treasury (basis points fee). */
export function computeVBlogReaderPaymentSplit(
  listKas: number,
  tier: KREXTier,
  nft?: NFTStatus | null,
  platformFeeBps: number = getVBlogPlatformFeeBps(),
): VBlogReaderPaymentSplit {
  const discountPercent = getVBlogModuleCombinedDiscountPercent(tier, nft ?? null);
  const discounted = getVBlogReaderUnlockPriceKas(listKas, tier, nft);
  let platformKas = Math.max(
    VBLOG_READER_MIN_OUTPUT_KAS,
    Math.round(((discounted * platformFeeBps) / 10_000) * 100) / 100,
  );
  let authorKas = Math.max(
    VBLOG_READER_MIN_OUTPUT_KAS,
    Math.round((discounted - platformKas) * 100) / 100,
  );
  // Keep both legs above the dust floor even when Tier discounts shrink the list price.
  if (authorKas + platformKas < discounted) {
    authorKas = Math.max(VBLOG_READER_MIN_OUTPUT_KAS, Math.round((discounted - platformKas) * 100) / 100);
  }
  const totalKas = Math.round((authorKas + platformKas) * 100) / 100;
  return { totalKas, platformKas, authorKas, discountPercent, listKas };
}
