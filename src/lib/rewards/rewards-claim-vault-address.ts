import type { Address } from 'viem';

/**
 * Default Igra mainnet RewardsClaimVault (see scripts/fund-rewards-claim-vault.js).
 * Override with NEXT_PUBLIC_REWARDS_CLAIM_VAULT_ADDRESS when you deploy a new vault.
 */
export const REWARDS_CLAIM_VAULT_IGRA_MAINNET_FALLBACK =
  '0xdC151b27ECE53F1c5FEaF0f18d333d4C94dAC703' as Address;

export function getRewardsClaimVaultAddress(chainId: number): Address | null {
  const env =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REWARDS_CLAIM_VAULT_ADDRESS?.trim()) || '';
  if (/^0x[a-fA-F0-9]{40}$/.test(env)) return env as Address;
  if (chainId === 38833) return REWARDS_CLAIM_VAULT_IGRA_MAINNET_FALLBACK;
  return null;
}
