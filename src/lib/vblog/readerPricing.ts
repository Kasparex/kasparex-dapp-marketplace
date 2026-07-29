import type { NFTStatus } from '@/lib/rewards/types';
import type { KREXTier } from '@/lib/rewards/types';
import { getVBlogPlatformFeeBps } from '@/lib/vblog/config';
import { getVBlogModuleCombinedDiscountPercent } from '@/lib/vblog/modules';

/**
 * Minimum KAS per payment leg (author share or platform fee).
 * Tiny outputs (especially the platform fee after Tier discounts) trigger
 * Kaspa "Storage mass exceeds maximum" when the wallet is UTXO-fragmented.
 * 1 KAS matches Ads binding and the first solid mass-retry rung.
 */
export const VBLOG_READER_MIN_OUTPUT_KAS = 1;

export type VBlogReaderPaymentSplitOptions = {
  /** When false, skip KREX tier discounts (tips go at list amount). Default true. */
  applyKrexDiscount?: boolean;
  /** Override platform fee bps. Use 0 so tips go fully to the author. */
  platformFeeBps?: number;
};

/** Reader-facing unlock price after optional KREX tier discounts. */
export function getVBlogReaderUnlockPriceKas(
  baseKas: number,
  tier: KREXTier,
  nft?: NFTStatus | null,
  applyKrexDiscount: boolean = true,
): number {
  if (!Number.isFinite(baseKas) || baseKas <= 0) return 0;
  if (!applyKrexDiscount) {
    return Math.max(VBLOG_READER_MIN_OUTPUT_KAS, Math.round(baseKas * 100) / 100);
  }
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

/** Split a reader payment between author payout(s) and platform treasury. */
export function computeVBlogReaderPaymentSplit(
  listKas: number,
  tier: KREXTier,
  nft?: NFTStatus | null,
  platformFeeBpsOrOpts: number | VBlogReaderPaymentSplitOptions = getVBlogPlatformFeeBps(),
): VBlogReaderPaymentSplit {
  const opts: VBlogReaderPaymentSplitOptions =
    typeof platformFeeBpsOrOpts === 'number'
      ? { platformFeeBps: platformFeeBpsOrOpts, applyKrexDiscount: true }
      : platformFeeBpsOrOpts;

  const applyKrexDiscount = opts.applyKrexDiscount !== false;
  const platformFeeBps =
    typeof opts.platformFeeBps === 'number' ? opts.platformFeeBps : getVBlogPlatformFeeBps();

  const discountPercent = applyKrexDiscount
    ? getVBlogModuleCombinedDiscountPercent(tier, nft ?? null)
    : 0;
  const discounted = getVBlogReaderUnlockPriceKas(listKas, tier, nft, applyKrexDiscount);

  if (platformFeeBps <= 0) {
    const authorKas = Math.max(VBLOG_READER_MIN_OUTPUT_KAS, Math.round(discounted * 100) / 100);
    return {
      totalKas: authorKas,
      platformKas: 0,
      authorKas,
      discountPercent,
      listKas,
    };
  }

  let platformKas = Math.max(
    VBLOG_READER_MIN_OUTPUT_KAS,
    Math.round(((discounted * platformFeeBps) / 10_000) * 100) / 100,
  );
  let authorKas = Math.max(
    VBLOG_READER_MIN_OUTPUT_KAS,
    Math.round((discounted - platformKas) * 100) / 100,
  );
  // If floors inflate past the discounted list price, keep both legs at the mass-safe minimum.
  if (authorKas + platformKas < discounted) {
    authorKas = Math.max(VBLOG_READER_MIN_OUTPUT_KAS, Math.round((discounted - platformKas) * 100) / 100);
  }
  const totalKas = Math.round((authorKas + platformKas) * 100) / 100;
  return { totalKas, platformKas, authorKas, discountPercent, listKas };
}
