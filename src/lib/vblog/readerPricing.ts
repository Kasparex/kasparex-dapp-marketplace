import type { NFTStatus } from '@/lib/rewards/types';
import type { KREXTier } from '@/lib/rewards/types';
import { getVBlogPlatformFeeBps } from '@/lib/vblog/config';
import { getVBlogModuleCombinedDiscountPercent } from '@/lib/vblog/modules';

/** Reader-facing unlock price after KREX / NFT holder discounts. */
export function getVBlogReaderUnlockPriceKas(
  baseKas: number,
  tier: KREXTier,
  nft?: NFTStatus | null,
): number {
  if (!Number.isFinite(baseKas) || baseKas <= 0) return 0;
  const discount = getVBlogModuleCombinedDiscountPercent(tier, nft ?? null);
  const factor = 1 - discount / 100;
  return Math.max(0.01, Math.round(baseKas * factor * 100) / 100);
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
  const totalKas = getVBlogReaderUnlockPriceKas(listKas, tier, nft);
  const platformKas = Math.max(0.01, Math.round(((totalKas * platformFeeBps) / 10_000) * 100) / 100);
  const authorKas = Math.max(0.01, Math.round((totalKas - platformKas) * 100) / 100);
  return { totalKas, platformKas, authorKas, discountPercent, listKas };
}
