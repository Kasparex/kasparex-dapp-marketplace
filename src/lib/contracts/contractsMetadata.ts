/**
 * Smart contract metadata for Stats: descriptions, categories, relationships, and basic params.
 * Contract keys must match CONTRACT_ADDRESSES (e.g. kasplexL2Testnet).
 * New keys added in addresses.ts will appear with fallback metadata if not listed here.
 */

import { CONTRACT_ADDRESSES, getContractAddress } from './addresses';

export type ContractKey = keyof typeof CONTRACT_ADDRESSES.kasplexL2Testnet;

export type ContractCategory =
  | 'core'
  | 'registry'
  | 'dapp'
  | 'tokens'
  | 'rewards'
  | 'other';

export type BasicParamKey = 'balance' | 'treasury' | 'symbol';

export interface ContractMetadataEntry {
  description: string;
  category: ContractCategory;
  linksTo?: ContractKey[];
  params?: BasicParamKey[];
}

const CONTRACT_METADATA: Partial<Record<ContractKey, ContractMetadataEntry>> = {
  Treasury: {
    description: 'Holds collected fees and distributes revenue to treasury, developers, and builders.',
    category: 'core',
    linksTo: [],
    params: ['balance'],
  },
  FeeCollector: {
    description: 'Collects fees from dApps and forwards them to the Treasury.',
    category: 'core',
    linksTo: ['Treasury'],
    params: ['treasury'],
  },
  FeeRouter: {
    description: 'Routes fee payments to the appropriate collector or handler.',
    category: 'core',
    linksTo: ['FeeCollector', 'FeeHandler'],
  },
  FeeHandler: {
    description: 'Processes and allocates fee streams.',
    category: 'core',
    linksTo: ['Treasury', 'FeeCollector'],
  },
  DAppRegistry: {
    description: 'Registry of approved dApps on the platform.',
    category: 'registry',
    linksTo: ['SimplePayment', 'DAOVoting', 'QuizToEarn', 'PlatformSubscription'],
  },
  AuthorizationRegistry: {
    description: 'Manages developer and dApp authorization and permissions.',
    category: 'registry',
    linksTo: ['DAppRegistry'],
  },
  ProfileRegistry: {
    description: 'Stores user profile data and on-chain identity.',
    category: 'registry',
    linksTo: ['UserProfileDashboard'],
  },
  SimplePayment: {
    description: 'dApp for simple payments and transfers.',
    category: 'dapp',
    linksTo: ['FeeCollector', 'DAppRegistry'],
  },
  DAOVoting: {
    description: 'Governance dApp for DAO proposals and voting.',
    category: 'dapp',
    linksTo: ['FeeCollector', 'DAppRegistry'],
  },
  QuizToEarn: {
    description: 'Gamified quiz dApp with rewards.',
    category: 'dapp',
    linksTo: ['FeeCollector', 'DAppRegistry', 'RewardManager'],
  },
  PlatformSubscription: {
    description: 'Platform-level subscription plans.',
    category: 'dapp',
    linksTo: ['SubscriptionManager', 'FeeCollector'],
  },
  DAppSubscription: {
    description: 'Per-dApp subscription logic.',
    category: 'dapp',
    linksTo: ['SubscriptionManager', 'PlatformSubscription'],
  },
  SubscriptionManager: {
    description: 'Manages subscription state and billing.',
    category: 'dapp',
    linksTo: ['FeeCollector', 'PlatformSubscription', 'DAppSubscription'],
  },
  GRIDToken: {
    description: 'ERC-20 GRID token for rewards and ecosystem.',
    category: 'tokens',
    linksTo: ['RewardManager', 'RewardVault'],
    params: ['symbol'],
  },
  tGRID: {
    description: 'Testnet GRID token (e.g. on IGRA Galleon).',
    category: 'tokens',
    linksTo: ['RewardManager'],
    params: ['symbol'],
  },
  RewardManager: {
    description: 'Distributes GRID and other rewards to participants.',
    category: 'rewards',
    linksTo: ['GRIDToken', 'RewardVault', 'ProofOfUtility'],
  },
  RewardVault: {
    description: 'Holds reward tokens for distribution.',
    category: 'rewards',
    linksTo: ['RewardManager', 'GRIDToken'],
  },
  ProofOfUtility: {
    description: 'Tracks utility and eligibility for rewards.',
    category: 'rewards',
    linksTo: ['RewardManager'],
  },
  SecureProofOfUtility: {
    description: 'Secure verification of proof-of-utility claims.',
    category: 'rewards',
    linksTo: ['ProofOfUtility', 'RewardManager'],
  },
  AffiliateManager: {
    description: 'Manages affiliate referrals and commissions.',
    category: 'other',
    linksTo: ['FeeHandler'],
  },
  LoyaltyPoints: {
    description: 'Loyalty and points program contract.',
    category: 'other',
    linksTo: ['RewardManager'],
  },
  UserProfileDashboard: {
    description: 'Aggregates user profile and activity data.',
    category: 'other',
    linksTo: ['ProfileRegistry'],
  },
  AdminDashboard: {
    description: 'Admin and moderation controls.',
    category: 'other',
    linksTo: ['AuthorizationRegistry', 'DAppRegistry'],
  },
  RevenueTreeManager: {
    description: 'Manages revenue tree and distribution logic.',
    category: 'other',
    linksTo: ['FeeHandler', 'Treasury'],
  },
  PromoMintRouter: {
    description: 'Promotional mint router for token campaigns.',
    category: 'other',
    linksTo: [],
  },
  GenesisBadge: {
    description: 'Genesis or early-adopter badge NFT contract.',
    category: 'other',
    linksTo: [],
  },
  DonationEscrow: {
    description: 'Escrow for donation campaigns and creator payouts.',
    category: 'other',
    linksTo: ['Treasury'],
  },
};

/** All contract keys from addresses (single source: kasplexL2Testnet). */
export const CONTRACT_KEYS: ContractKey[] = Object.keys(
  CONTRACT_ADDRESSES.kasplexL2Testnet
) as ContractKey[];

const DEFAULT_METADATA: ContractMetadataEntry = {
  description: 'Smart contract.',
  category: 'other',
  linksTo: [],
};

export function getContractMetadata(key: ContractKey): ContractMetadataEntry {
  const entry = CONTRACT_METADATA[key];
  return entry ?? DEFAULT_METADATA;
}

export function getContractTree(): { category: ContractCategory; keys: ContractKey[] }[] {
  const byCategory = new Map<ContractCategory, ContractKey[]>();
  for (const key of CONTRACT_KEYS) {
    const { category } = getContractMetadata(key);
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category)!.push(key);
  }
  const order: ContractCategory[] = ['core', 'registry', 'dapp', 'tokens', 'rewards', 'other'];
  return order
    .filter((c) => byCategory.has(c))
    .map((category) => ({ category, keys: byCategory.get(category)! }));
}

export function getContractsWithAddress(chainId: number): ContractKey[] {
  return CONTRACT_KEYS.filter((key) => {
    const addr = getContractAddress(chainId, key);
    return !!addr && addr.startsWith('0x');
  });
}
