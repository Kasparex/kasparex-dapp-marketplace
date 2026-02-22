/** L1 Kaspa address that receives ad payments (env: NEXT_PUBLIC_ADS_TREASURY_L1_ADDRESS) */
const DEFAULT_ADS_TREASURY_L1 = 'kaspa:qr54v0692g4csc45z6phshyh2twy5dv73mylx5uqjtpphynvg70vksky9xffw';

export function getAdsTreasuryL1Address(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ADS_TREASURY_L1_ADDRESS) {
    return process.env.NEXT_PUBLIC_ADS_TREASURY_L1_ADDRESS.trim();
  }
  return DEFAULT_ADS_TREASURY_L1;
}

/** 1 KAS = 100_000_000 sompi */
export const KAS_SOMPI = 100_000_000;

export function kasToSompi(kas: number): number {
  return Math.floor(kas * KAS_SOMPI);
}
