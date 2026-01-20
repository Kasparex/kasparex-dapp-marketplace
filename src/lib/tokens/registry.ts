/**
 * Token Registry
 * Central registry for all ecosystem tokens
 */

import type { Token } from './types';
import { placeholderDApps } from '@/lib/dapps';
import { getContractAddress } from '@/lib/contracts/addresses';
import { slugify } from '@/lib/utils';

// KREX Token (L1 + L2)
const KREX_L2_ADDRESS = '0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B';

/**
 * Base token registry
 * Tokens can be extended with IPFS metadata
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
    chainId: undefined, // KAS is native to Kaspa L1
    contractAddress: undefined, // KAS is the native token, not a contract
    type: 'global',
    decimals: 8,
  },
  {
    id: 'krex',
    slug: 'krex',
    name: 'Kasparex Token',
    symbol: 'KREX',
    description: 'KREX is the flagship token of the Kasparex ecosystem. It serves as the governance token, brand identity, and treasury backbone. With a fixed supply of 21 billion tokens, KREX holders unlock tier-based benefits including fee reductions, reward multipliers, and exclusive access to premium features across the ecosystem.',
    shortDescription: 'Flagship governance token of the Kasparex ecosystem',
    network: 'L2', // Primary network (also available on L1)
    chainId: 202555, // Kasplex L2 Mainnet
    contractAddress: KREX_L2_ADDRESS,
    l1Address: undefined, // KREX exists on L1 as KRC20 token (ticker: KREX)
    l2Address: KREX_L2_ADDRESS,
    type: 'global',
    totalSupply: 21_000_000_000,
    maxSupply: 21_000_000_000,
    circulatingSupply: 21_000_000_000, // Fully minted
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
  },
  {
    id: 'grid',
    slug: 'grid',
    name: 'Global Reward Token',
    symbol: 'GRID',
    description: 'GRID is the global reward token distributed across all dApps in the Kasparex ecosystem. With a fixed supply and deflationary mechanics, GRID tokens are earned through Proof-of-Utility by actively using dApps. Tokens are stored in the RewardVault and burned on redemption, creating increasing scarcity over time.',
    shortDescription: 'Global reward token for all Kasparex dApps',
    network: 'L2',
    chainId: 202555,
    type: 'global',
    decimals: 18,
    allocations: [
      { category: 'Reward Vault', percentage: 100, description: 'Distributed via Proof-of-Utility' },
    ],
    links: [
      { label: 'Website', url: 'https://kasparex.com', type: 'website' },
    ],
    tags: ['rewards', 'utility', 'deflationary'],
  },
  {
    id: 'test-genesis-v1',
    slug: 'test-genesis-v1',
    name: 'Test Genesis Token',
    symbol: 'TGEN',
    description: 'Test token for the Promo Engine on Igra Caravel Testnet. Used for testing minting, promotion, and revenue sharing features.',
    shortDescription: 'Test token for Promo Engine',
    network: 'L2',
    chainId: 19416, // Igra Caravel Testnet
    contractAddress: '0x86a779696878f054A8D549273453f6A2fC896769',
    type: 'local',
    decimals: 18,
    maxSupply: 100_000_000, // 100M tokens
    allocations: [
      { category: 'Use-to-mint', percentage: 80, description: 'Rewards for active usage' },
      { category: 'Liquidity', percentage: 10, description: 'Reserved for DEX liquidity' },
      { category: 'Treasury', percentage: 5, description: 'Kasparex + Project treasury' },
      { category: 'Dev', percentage: 3, description: 'Development and maintenance' },
      { category: 'Airdrops', percentage: 2, description: 'Airdrops and bonuses' },
    ],
    links: [
      { label: 'Explorer', url: 'https://explorer.caravel.igralabs.com/address/0x86a779696878f054A8D549273453f6A2fC896769', type: 'explorer' },
    ],
    tags: ['test', 'promo-engine', 'igra-testnet'],
  },
  {
    id: 'test-genesis-v2',
    slug: 'test-genesis-v2',
    name: 'Test Genesis Token V2',
    symbol: 'TGEN2',
    description: 'Test token V2 for the Promo Engine on Igra Caravel Testnet. Used for testing minting with 10 KAS price.',
    shortDescription: 'Test token V2 for Promo Engine (10 KAS)',
    network: 'L2',
    chainId: 19416, // Igra Caravel Testnet
    contractAddress: '0x86a779696878f054A8D549273453f6A2fC896769', // Same contract, different registration
    type: 'local',
    decimals: 18,
    maxSupply: 100_000_000, // 100M tokens
    allocations: [
      { category: 'Use-to-mint', percentage: 80, description: 'Rewards for active usage' },
      { category: 'Liquidity', percentage: 10, description: 'Reserved for DEX liquidity' },
      { category: 'Treasury', percentage: 5, description: 'Kasparex + Project treasury' },
      { category: 'Dev', percentage: 3, description: 'Development and maintenance' },
      { category: 'Airdrops', percentage: 2, description: 'Airdrops and bonuses' },
    ],
    links: [
      { label: 'Explorer', url: 'https://explorer.caravel.igralabs.com/address/0x86a779696878f054A8D549273453f6A2fC896769', type: 'explorer' },
    ],
    tags: ['test', 'promo-engine', 'igra-testnet', 'v2'],
  },
];

/**
 * Generate tokens from dApps
 * Each dApp can have an associated token
 */
export function getDAppTokens(): Token[] {
  return placeholderDApps
    .filter((dapp) => {
      // Only include dApps that have or should have tokens
      // You can filter based on contract data or other criteria
      return true; // Include all for now
    })
    .map((dapp) => {
      const slug = dapp.slug || slugify(dapp.name);
      return {
        id: `dapp-${dapp.id}`,
        slug: `${slug}-token`,
        name: `${dapp.name} Token`,
        symbol: slugify(dapp.name).substring(0, 6).toUpperCase().replace(/-/g, ''),
        description: `Native token for the ${dapp.name} dApp. Earned through active usage and participation.`,
        shortDescription: `Token for ${dapp.name}`,
        network: dapp.network === 'Mainnet' ? 'L2' : 'L2', // Default to L2 for dApp tokens
        chainId: 202555, // Kasplex L2 Mainnet
        type: 'local',
        parentDAppId: dapp.id,
        relatedDAppIds: [dapp.id],
        contractAddress: dapp.contractAddress,
        decimals: 18,
        allocations: [
          { category: 'Use-to-mint', percentage: 80, description: 'Rewards for active usage' },
          { category: 'Liquidity', percentage: 10, description: 'Reserved for DEX liquidity' },
          { category: 'Treasury', percentage: 5, description: 'Kasparex + Project treasury' },
          { category: 'Dev', percentage: 3, description: 'Development and maintenance' },
          { category: 'Airdrops', percentage: 2, description: 'Airdrops and bonuses' },
        ],
        links: dapp.developerLinks?.map((link) => ({
          label: link.label,
          url: link.url,
          type: 'other' as const,
        })) || [],
        tags: ['dapp-token', 'utility', dapp.category],
      } as Token;
    });
}

/**
 * Get all tokens (base + dApp tokens)
 */
export function getAllTokens(): Token[] {
  return [...baseTokens, ...getDAppTokens()];
}

/**
 * Get token by slug
 */
export function getTokenBySlug(slug: string): Token | undefined {
  return getAllTokens().find((token) => token.slug === slug);
}

/**
 * Get token by ID
 */
export function getTokenById(id: string): Token | undefined {
  return getAllTokens().find((token) => token.id === id);
}

/**
 * Get tokens by type
 */
export function getTokensByType(type: Token['type']): Token[] {
  return getAllTokens().filter((token) => token.type === type);
}

/**
 * Get tokens by network
 */
export function getTokensByNetwork(network: Token['network']): Token[] {
  return getAllTokens().filter((token) => token.network === network);
}

/**
 * Get tokens related to a dApp
 */
export function getTokensByDAppId(dAppId: string): Token[] {
  return getAllTokens().filter(
    (token) => token.parentDAppId === dAppId || token.relatedDAppIds?.includes(dAppId)
  );
}
