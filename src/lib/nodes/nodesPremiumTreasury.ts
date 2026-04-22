import { getDonationsModulesTreasuryL1Address } from '@/lib/donations/modulesConfig';

/**
 * L1 Kaspa treasury for Nodes premium analytics unlock (10 KAS).
 * Prefer dedicated env; fall back to game treasury then donations module treasury.
 */
export function getNodesPremiumTreasuryL1Address(): string {
  return (
    (process.env.NEXT_PUBLIC_NODES_PREMIUM_TREASURY_L1 || '').trim() ||
    (process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '').trim() ||
    getDonationsModulesTreasuryL1Address()
  );
}
