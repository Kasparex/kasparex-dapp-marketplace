import type { Address } from 'viem';
import { IGRA_POOL_REWARDS_VAULT_ADDRESS } from '@/lib/rewards/igra-pool-vault';

export { IGRA_POOL_REWARDS_VAULT_ADDRESS } from '@/lib/rewards/igra-pool-vault';

/**
 * Vault used for GRID/KREX **pool balance** reads in the catalog. Must match Worker `REWARDS_CLAIM_VAULT_ADDRESS`.
 * @see igra-pool-vault.ts for the full Hub vs Worker explanation.
 */
export function getRewardsClaimVaultAddress(chainId: number): Address | null {
  const env =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_REWARDS_CLAIM_VAULT_ADDRESS?.trim()) || '';
  if (/^0x[a-fA-F0-9]{40}$/.test(env)) return env as Address;
  if (chainId === 38833) return IGRA_POOL_REWARDS_VAULT_ADDRESS;
  return null;
}
