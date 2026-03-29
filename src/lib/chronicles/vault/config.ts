import { getAdsTreasuryL1Address } from '@/lib/ads/config';

/**
 * L1 treasury for Chronicles vault unlocks.
 * Set `NEXT_PUBLIC_CHRONICLES_VAULT_TREASURY_L1_ADDRESS` to separate from ads; otherwise falls back to ads treasury.
 */
export function getChroniclesVaultTreasuryL1Address(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CHRONICLES_VAULT_TREASURY_L1_ADDRESS?.trim()) {
    return process.env.NEXT_PUBLIC_CHRONICLES_VAULT_TREASURY_L1_ADDRESS.trim();
  }
  return getAdsTreasuryL1Address();
}
