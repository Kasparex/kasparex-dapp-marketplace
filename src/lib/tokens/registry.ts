/**
 * Token Registry
 * Central registry for ecosystem tokens (KREX, GRID, KAS, and future UaaS listings).
 */

import type { Token } from './types';
import { getContractAddress } from '@/lib/contracts/addresses';

// KREX Token (L1 + L2)
const KREX_L2_ADDRESS = '0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B';

/**
 * Base token registry
 * Tokens can be extended with IPFS metadata and dashboard-published listings.
 */
export const baseTokens: Token[] = [
  {
    id: 'kas',
    slug: 'kas',
    name: 'Kaspa',
    symbol: 'KAS',
    description: 'Kaspa is a proof-of-work cryptocurrency implementing the GHOSTDAG protocol. Unlike traditional blockchains, Kaspa uses a blockDAG structure, allowing for high block rates while maintaining the security guarantees of proof-of-work.',
    shortDescription: 'Native cryptocurrency of the Kaspa network',
    network: 'L1',
    chainId: undefined,
    contractAddress: undefined,
    type: 'global',
    decimals: 8,
    listing: {
      verified: true,
      instantUtility: true,
      featured: true,
      utilityBadges: ['Payments', 'Swaps', 'Native L1'],
      activityScore: 95,
      communityScore: 120,
    },
    tags: ['native', 'payments', 'l1'],
  },
  {
    id: 'krex',
    slug: 'krex',
    name: 'Kasparex Token',
    symbol: 'KREX',
    description: 'KREX is the flagship token of the Kasparex ecosystem. It serves as the governance token, brand identity, and treasury backbone. With a fixed supply of 21 billion tokens, KREX holders unlock tier-based benefits including fee reductions, reward multipliers, and exclusive access to premium features across the ecosystem.',
    shortDescription: 'Flagship governance token of the Kasparex ecosystem',
    network: 'L2',
    chainId: 202555,
    contractAddress: KREX_L2_ADDRESS,
    l1Address: undefined,
    l2Address: KREX_L2_ADDRESS,
    type: 'global',
    totalSupply: 21_000_000_000,
    maxSupply: 21_000_000_000,
    circulatingSupply: 21_000_000_000,
    decimals: 18,
    allocations: [
      { category: 'Circulating', percentage: 100, description: 'Fixed supply of 21B tokens' },
    ],
    links: [
      { label: 'Website', url: 'https://kasparex.com', type: 'website' },
      { label: 'Explorer', url: `https://explorer.kasplex.org/address/${KREX_L2_ADDRESS}`, type: 'explorer' },
      { label: 'Telegram', url: 'https://t.me/kasparex', type: 'social' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex', type: 'social' },
    ],
    tags: ['governance', 'flagship', 'tier-benefits'],
    listing: {
      verified: true,
      instantUtility: true,
      featured: true,
      utilityBadges: ['Payments', 'Store', 'vBlog Tips', 'Tier Benefits'],
      activityScore: 100,
      communityScore: 200,
    },
  },
  {
    id: 'grid',
    slug: 'grid',
    name: 'Global Reward Token (GRID)',
    symbol: 'GRID',
    description: 'GRID has a fixed supply of 10B on Kaspa L1. L2 deployments are operational layers used for rewards and utility across Kasparex dApps. GRID is earned through Proof-of-Utility by actively using dApps, and can be used for perks, upgrades, and reward programs.',
    shortDescription: 'Fixed 10B supply on Kaspa L1; L2 is operational layer',
    network: 'L2',
    chainId: 202555,
    type: 'global',
    contractAddress: getContractAddress(202555, 'GRIDToken') || undefined,
    totalSupply: 10_000_000_000,
    maxSupply: 10_000_000_000,
    decimals: 8,
    allocations: [
      { category: 'Fixed supply (Kaspa L1)', percentage: 100, description: 'Canonical supply is fixed at 10B on Kaspa L1' },
    ],
    links: [
      { label: 'Website', url: 'https://kasparex.com', type: 'website' },
    ],
    tags: ['rewards', 'utility', 'deflationary'],
    listing: {
      verified: true,
      instantUtility: true,
      featured: true,
      utilityBadges: ['Rewards', 'Redemptions', 'Hub Points'],
      activityScore: 90,
      communityScore: 150,
    },
  },
];

export function getAllTokens(): Token[] {
  return [...baseTokens];
}

export function getTokenBySlug(slug: string): Token | undefined {
  return getAllTokens().find((token) => token.slug === slug);
}

export function getTokenById(id: string): Token | undefined {
  return getAllTokens().find((token) => token.id === id);
}

export function getTokensByType(type: Token['type']): Token[] {
  return getAllTokens().filter((token) => token.type === type);
}

export function getTokensByNetwork(network: Token['network']): Token[] {
  return getAllTokens().filter((token) => token.network === network);
}
