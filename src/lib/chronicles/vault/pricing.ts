import type { KREXTier, NFTStatus } from '@/lib/rewards/types';
import { VAULT_MAX_COMBINED_DISCOUNT_PERCENT } from '@/lib/chronicles/vault/constants';

const KREX_DISCOUNT_PCT: Record<KREXTier, number> = {
  Tier0: 0,
  Tier1: 2,
  Tier2: 5,
  Tier3: 9,
  Tier4: 14,
};

export function krexTierDiscountPercent(tier: KREXTier): number {
  return KREX_DISCOUNT_PCT[tier] ?? 0;
}

export function chroniclesNftTierDiscountPercent(nft: NFTStatus | null | undefined): number {
  if (!nft) return 0;
  if (nft.hasRarestNFT) return 18;
  if (nft.hasDiamondKREXPRIME || nft.hasDiamondPIXELKREX) return 12;
  if (nft.hasKREXPRIME || nft.hasPIXELKREX) return 7;
  return 0;
}

/** Effective price in KAS after KREX + NFT discounts (floored to cent). */
export function vaultEffectivePriceKas(
  baseKas: number,
  krexTier: KREXTier,
  nft: NFTStatus | null | undefined
): number {
  const combined = Math.min(
    VAULT_MAX_COMBINED_DISCOUNT_PERCENT,
    krexTierDiscountPercent(krexTier) + chroniclesNftTierDiscountPercent(nft)
  );
  const factor = 1 - combined / 100;
  return Math.max(0.01, Math.round(baseKas * factor * 100) / 100);
}
