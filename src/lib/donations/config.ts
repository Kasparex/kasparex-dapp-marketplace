/**
 * Kasparex vDonations config: min amounts, fee BPS, platform L1 address.
 */

export const VDONATIONS_MIN_DONATION_KAS = 10;
export const VDONATIONS_MIN_DONATION_WEI = 10n * 10n ** 18n; // 10 iKAS
/** L1 platform fee: 1% of donation (min 1 KAS) — used for L1 path only */
export const VDONATIONS_FEE_BPS = 100; // 1%
/** L2 platform fee: 10% of donation goes to Revenue Tree (on-chain feeBps = 1000) */
export const VDONATIONS_L2_FEE_PERCENT = 10;
export const VDONATIONS_MIN_VERIFY_WEI = 1n;
export const VDONATIONS_MIN_FEE_KAS = 1; // minimum platform fee in KAS for L1

/** Platform L1 Kaspa address for L1 donation fees (env: NEXT_PUBLIC_VDONATIONS_PLATFORM_L1_ADDRESS) */
const DEFAULT_PLATFORM_L1_ADDRESS = 'kaspa:qr54v0692g4csc45z6phshyh2twy5dv73mylx5uqjtpphynvg70vksky9xffw';

export function getPlatformL1Address(): string {
  return (process.env.NEXT_PUBLIC_VDONATIONS_PLATFORM_L1_ADDRESS || DEFAULT_PLATFORM_L1_ADDRESS).trim();
}

/** Compute L1 platform fee in KAS (1% of donation, min 1 KAS) */
export function computeL1FeeKAS(donationKAS: number): number {
  const fee = Math.max(VDONATIONS_MIN_FEE_KAS, (donationKAS * VDONATIONS_FEE_BPS) / 10000);
  return Math.ceil(fee);
}
