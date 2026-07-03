/**
 * Seed claims map ecosystem registry token pages (KREX, GRID, KAS) to the deployer
 * wallets that are allowed to manage them from the Developer Dashboard.
 *
 * Claiming creates a manageable published listing seeded from the registry token so
 * the owner can edit and (for real tokens) verify it on-chain.
 */

import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { getAllTokens } from './registry';
import type { Token } from './types';

export type TokenSeedClaim = {
  slug: string;
  /** Kaspa L1 deployer wallet allowed to manage the page. */
  ownerWallet: string;
  /** KAS is a coin, not a deployed token: it can be managed but not deployer-verified. */
  coin?: boolean;
};

export const TOKEN_SEED_CLAIMS: TokenSeedClaim[] = [
  {
    slug: 'krex',
    ownerWallet: 'kaspa:qzjlaf7h6pq2spewz8wfa6g2xwz29y0y6x57umyj6capdjvny9znur8j2lul8',
  },
  {
    slug: 'grid',
    ownerWallet: 'kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp',
  },
  {
    slug: 'kas',
    ownerWallet: 'kaspa:qzdfxy68rdcwyukrpja0dcc4994p3w49tlermjdvkgnqej77ajhqw6pgxlwfp',
    coin: true,
  },
];

function sameWallet(a: string, b: string): boolean {
  const na = String(a || '').trim();
  const nb = String(b || '').trim();
  if (!na || !nb) return false;
  if (na.toLowerCase() === nb.toLowerCase()) return true;
  try {
    return normalizeKaspaAddress(na).toLowerCase() === normalizeKaspaAddress(nb).toLowerCase();
  } catch {
    return false;
  }
}

export function getSeedClaimForWallet(walletAddress: string | null | undefined): TokenSeedClaim[] {
  if (!walletAddress) return [];
  return TOKEN_SEED_CLAIMS.filter((claim) => sameWallet(claim.ownerWallet, walletAddress));
}

export type ClaimableSeed = TokenSeedClaim & { token: Token };

export function getClaimableSeeds(walletAddress: string | null | undefined): ClaimableSeed[] {
  const claims = getSeedClaimForWallet(walletAddress);
  if (claims.length === 0) return [];
  const tokens = getAllTokens();
  const result: ClaimableSeed[] = [];
  for (const claim of claims) {
    const token = tokens.find((t) => t.slug === claim.slug);
    if (token) result.push({ ...claim, token });
  }
  return result;
}
