import { keccak256, toHex } from 'viem';

export type DonationPaidModuleId = 'featured';

export const DONATION_MODULE_IDS: Record<DonationPaidModuleId, `0x${string}`> = {
  featured: keccak256(toHex('featured')),
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
};

export const DONATIONS_MODULE_PAYLOAD_PREFIX = 'CROWDKAS_MODULE:';

