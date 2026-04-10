import { keccak256, toHex } from 'viem';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';

export type DonationPaidModuleId = 'featured' | 'l1Tips';

export const DONATION_MODULE_IDS: Record<DonationPaidModuleId, `0x${string}`> = {
  featured: keccak256(toHex('featured')),
  l1Tips: keccak256(toHex('l1Tips')),
};

export const DONATION_MODULE_OFFERS: Record<
  DonationPaidModuleId,
  { id: DonationPaidModuleId; title: string; description: string; basePriceKas: number }
> = {
  featured: {
    id: 'featured',
    title: 'Featured placement',
    description: 'Adds a Featured badge and boosts visibility in listings.',
    basePriceKas: 25,
  },
  l1Tips: {
    id: 'l1Tips',
    title: 'L1 tip jar (premium)',
    description:
      'Unlock an optional Kaspa L1 tip box on your campaign page. L1 tips do not count toward the L2 escrow goal; they are extra support + points.',
    basePriceKas: 25,
  },
};

export const DONATIONS_MODULE_PAYLOAD_PREFIX = 'CROWDKAS_MODULE:';

export function isDonationPaidModuleId(x: string): x is DonationPaidModuleId {
  return x === 'featured' || x === 'l1Tips';
}

/** Minimum KAS to pay on L1 for a module unlock (tiers + NFTs stack, capped). Used client-side and sent to /api/donations/modules/verify as `basePriceKas`. */
export function getDonationModulePriceKas(
  baseKas: number,
  krexBalance: number,
  krexTier: KREXTier,
  nft: { hasAny: boolean; hasDiamond: boolean; hasRarest: boolean }
): number {
  const tier = KREX_TIERS[krexTier];
  let discount = 0;
  if (krexBalance > 0) {
    discount += Math.min(0.2, tier.pointsMultiplier * 0.02);
  }
  if (nft.hasRarest) discount += 0.15;
  else if (nft.hasDiamond) discount += 0.08;
  else if (nft.hasAny) discount += 0.05;
  discount = Math.min(0.75, discount);
  const price = baseKas * (1 - discount);
  return Math.max(0.01, Math.round(price * 1000) / 1000);
}
