import { Category } from './categories';
import { CHAIN_IDS } from './wagmi';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

export type DAppStatus =
  | 'Mainnet'
  | 'Testnet'
  | 'Suspended';

export interface DeveloperLink {
  label: string;
  url: string;
}

export interface DApp {
  id: string;
  name: string;
  slug?: string; // URL-friendly identifier, auto-generated from name if not provided
  image?: string;
  /** Square logo for card icon slots (directory listings). */
  logoImage?: string;
  featuredImage?: string; // 16:9 featured image for sidebar display
  createdAt?: string; // ISO date string for sorting by creation date
  category: Category;
  utility: string;
  process: string;
  benefits: string;
  developer: string;
  developerLinks?: DeveloperLink[]; // Up to 3 links: website, social media profiles
  status: DAppStatus;
  network: string;
  provider: string;
  url?: string;
  widgetUrl?: string; // URL for embedded widget/iframe of the dApp
  version?: string;
  description?: string;
  security?: string;
  roadmap?: string;
  contractAddress?: string; // Smart contract address for the dApp
  deployerAddress?: string; // Address of the deployer/developer
  /**
   * Optional array of supported chain IDs for network compatibility checking.
   * If not provided, will be inferred from the network field using networkNameToChainIds.
   */
  supportedChainIds?: number[];
  /**
   * Network type: L1 (Kaspa native) or L2 (EVM-compatible).
   * If not explicitly set, will be inferred from the network field.
   */
  networkType?: 'L1' | 'L2';
  /**
   * Optional payment configuration for network-specific pricing.
   * If not provided, will use default payment configs based on dApp category/name.
   */
  paymentConfig?: {
    actions: Array<{
      actionId: string;
      actionName: string;
      baseCost: number;
      costL1?: number;
      costL2?: number;
    }>;
  };
  /** Kasparex integrated dApp vs community directory listing */
  source?: 'kasparex' | 'directory';
  directoryListingId?: string;
  tags?: string[];
  directoryListing?: import('@/lib/dapps/listingSubmissions').DirectoryListing;
}

// Placeholder dApps for template demonstration
export const placeholderDApps: DApp[] = [
  {
    id: '11',
    name: 'Simple Payment',
    slug: 'simple-payment',
    featuredImage: 'https://static.wixstatic.com/media/de4185_f26cef0e7bb9446d8c86258337bd5247~mv2.jpg',
    category: 'payment',
    utility: 'Send KAS payments with automatic fee collection to support the Kasparex ecosystem.',
    process: 'Enter recipient address and amount. A small fee (1%) is automatically deducted and sent to the treasury.',
    benefits: 'Simple, secure payments with transparent fee structure. Supports platform development.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kasplex Testnet',
    networkType: 'L2',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'Simple Payment is the first dApp on Kasparex, demonstrating our fee collection and revenue distribution system. Send KAS payments with a transparent 1% fee that supports platform development.',
    security: 'Built with OpenZeppelin contracts for security. All smart contracts use ReentrancyGuard to prevent reentrancy attacks. Fee collection is automated and transparent. Contracts are audited and follow best practices for EVM development.',
    roadmap: 'Q4 2025: Testnet launch and initial testing\nQ1 2026: Mainnet deployment\nQ2 2026: Enhanced features including batch payments and payment scheduling\nQ3 2026: Integration with Token Builder for automatic utility attachment',
    createdAt: '2025-11-05T16:21:29.306Z',
    supportedChainIds: [167012, 38836, 38833], // Kasplex Testnet, Igra Testnet, Igra Mainnet
    // Contract address will be fetched from environment variables via getContractAddress
    // deployerAddress will be fetched from DAppRegistry contract
  },
  {
    id: '12',
    name: 'DAO Voting',
    slug: 'dao-voting',
    featuredImage: 'https://static.wixstatic.com/media/de4185_874d8876b38a4c3e8923be3c38723d00~mv2.png',
    category: 'dao',
    utility: 'Submit and vote on future dApp ideas for marketplace integration',
    process: 'Submit proposals with 10 KAS fee, vote with 1 KAS fee per vote. High-vote proposals are flagged for review.',
    benefits: 'Community-driven dApp discovery and prioritization. Transparent on-chain voting with fee collection.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kasplex Testnet',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'DAO Voting enables community members to submit dApp ideas and vote on them. All proposals and votes are stored on-chain. Proposals that reach the vote threshold are automatically flagged for marketplace review.',
    security: 'Built with OpenZeppelin contracts for security. All smart contracts use ReentrancyGuard to prevent reentrancy attacks. Fee collection is automated and transparent.',
    roadmap: 'Q4 2025: Testnet launch and initial testing\nQ1 2026: Mainnet deployment\nQ2 2026: Enhanced features including proposal categories and advanced filtering\nQ3 2026: Integration with marketplace for automatic listing of approved proposals',
    createdAt: new Date().toISOString(),
    supportedChainIds: [167012, 202555, 38836, 38833], // Kasplex Testnet, Kasplex Mainnet, Igra Testnet, Igra Mainnet
    // Contract address will be fetched from environment variables via getContractAddress
    // deployerAddress will be fetched from DAppRegistry contract
  },
  {
    id: '15',
    name: 'Send KAS',
    slug: 'send-kas',
    featuredImage: 'https://static.wixstatic.com/media/de4185_19b2004ad09d4abeb7ff96e49b1cf7a3~mv2.png',
    category: 'payment',
    utility: 'Send KAS (Kaspa native currency) to any Kaspa address quickly and securely.',
    process: 'Enter recipient address and amount. Confirm transaction with your Kaspa wallet.',
    benefits: 'Simple, fast, and secure KAS transfers on the Kaspa L1 network. No smart contracts required.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Mainnet',
    network: 'Kaspa Mainnet',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'Send KAS is a simple dApp for sending Kaspa native currency (KAS) to any Kaspa address. Built on L1, it provides fast and secure transfers without requiring smart contracts.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '16',
    name: 'Send KREX',
    slug: 'send-krex',
    featuredImage: 'https://static.wixstatic.com/media/de4185_80a72a2cb33b49909fe69fccc8991a37~mv2.png',
    category: 'payment',
    utility: 'Send KREX tokens to any Kaspa address on the L1 network.',
    process: 'Enter recipient address and amount. Confirm KRC-20 token transfer with your Kaspa wallet.',
    benefits: 'Transfer KREX tokens directly on Kaspa L1 using KRC-20 standard. Fast and secure token transfers.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Mainnet',
    network: 'Kaspa Mainnet',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'Send KREX is a simple dApp for sending KREX tokens to any Kaspa address. Built on L1, it uses the KRC-20 token standard for secure token transfers.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'krex-wrap-bridge',
    name: 'KREX Wrap Bridge',
    slug: 'krex-wrap-bridge',
    featuredImage: 'https://static.wixstatic.com/media/de4185_80a72a2cb33b49909fe69fccc8991a37~mv2.png',
    category: 'payment',
    utility: 'Wrap KRC-20 KREX into KCC20 for covenant-native Hub utility while keeping 1:1 economic claim.',
    process: 'Pay a small KAS wrap fee, send KRC-20 KREX to the keyless vault, then receive matching KCC20 when the mint watcher confirms.',
    benefits: 'Same Hub tiers and multipliers once wrapped KCC20 is counted. One-way burn-in first; two-way unwrap later.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Mainnet',
    network: 'Kaspa Mainnet',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description:
      'KREX Wrap Bridge moves inscription KRC-20 KREX into a vault and mints covenant KCC20 1:1. Hub fees are paid in KAS with KREX tier discounts. Wrapped balances count toward Hub tiers when the KCC20 covenant id is configured.',
    security:
      'KRC-20 side relies on indexer-confirmed deposits to a configured vault. KCC20 mint is fulfilled by an automated watcher. This is not a fully trustless consensus bridge.',
    roadmap:
      'Now: One-way wrap UI + fee rail + deposit verify API + KCC20 balance in tier total\nNext: Production vault address + mint watcher\nLater: Two-way unwrap and multi-token factory',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'kaspa-capsule',
    name: 'Kaspa Capsule',
    slug: 'kaspa-capsule',
    featuredImage: 'https://static.wixstatic.com/media/de4185_b6ea8682bdc7442cae47abbe7bfacd5e~mv2.jpg',
    category: 'general',
    utility: 'Leave a permanent rich-text message on Kaspa L1 and become part of ecosystem history.',
    process: 'Connect wallet, compose your message with rich formatting, review payload chunks and fees, then publish to the Capsule archive.',
    benefits: 'Permanent on-chain time capsule, Hub Points on qualifying messages, covenant-ready payload model.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kaspa L1 Covenants',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.3.0',
    description: 'Kaspa Capsule is the Kasparex message board on Kaspa L1. Compose rich-text notes with payload-based pricing, browse the archive, and earn Hub Points when you publish.',
    security: 'Canonical JSON payloads committed on L1 via standard treasury payments. Covenant deploy wiring will attach when native covenant transactions ship.',
    roadmap: 'Done: Rich editor, L1 payments, Messages tab, Hub Points\nNext: Covenant deploy on mainnet\nFuture: Public indexer for Capsule archive',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lockbox',
    name: 'Lockbox',
    slug: 'lockbox',
    featuredImage: 'https://static.wixstatic.com/media/de4185_d559a0046ece4c46b20fe0476539658e~mv2.jpg',
    category: 'general',
    utility: 'Lock KAS for someone else with simple rules. Use escrow so they can claim anytime, or timelock so they can only claim after a date you choose.',
    process: 'Choose escrow or timelock, set who receives the KAS and how much, then create the lock. They claim when the rules allow.',
    benefits: 'Safe handoffs for trades, freelance work, and savings without a third party holding funds.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Silverscript', url: 'https://github.com/kaspanet/silverscript' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
    ],
    status: 'Mainnet',
    network: 'Kaspa L1 Covenants',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.2.0',
    description:
      'Lock KAS with escrow or timelock rules. Hold coins for someone until they can claim on your terms.',
    security:
      'L1 covenant runtime via Silverscript templates. Requires Toccata-ready wallet for on-chain mode; hybrid falls back to local simulator when wallet APIs are unavailable.',
    roadmap:
      'Done: Modular runtime + Silverscript wiring\nNext: Wallet covenant tx APIs on mainnet\nOptional: Compiled scriptHex in public/covenant/',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-split',
    name: 'Covenant Split',
    slug: 'covenant-split',
    featuredImage: 'https://static.wixstatic.com/media/de4185_2a64df8a87f7479b8f5ec6db8f726a1a~mv2.png',
    category: 'general',
    utility: 'Send one KAS payment to several people at once. Set the total, choose each share, and everyone claims their part independently.',
    process: 'Set the total amount, add recipients with shares (must total 100%), fund once. Each person claims their part.',
    benefits: 'Team payouts, revenue sharing, and prize pools without trusting someone to divide the money manually.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Lockbox', url: 'https://www.kasparex.com/dapps/lockbox' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
    ],
    status: 'Mainnet',
    network: 'Kaspa L1 Covenants',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.2.0',
    description:
      'Divide one KAS payment among several addresses. Lock once, set each share, and let everyone claim independently.',
    security:
      'Silverscript split-payment template with pluggable L1 runtime. Hybrid mode available while wallets roll out covenant APIs.',
    roadmap:
      'Done: Runtime + split-payment.sil wiring\nNext: Mainnet fan-out txs via wallet',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-milestone',
    name: 'Covenant Milestone',
    slug: 'covenant-milestone',
    featuredImage: 'https://static.wixstatic.com/media/de4185_55cce26976e74da2ac4bcac453e77fd0~mv2.jpg',
    category: 'general',
    utility: 'Pay someone in steps. Lock the full amount up front, then release each part on the dates you set.',
    process: 'Set who gets paid, split the total into milestones, and fund once. They claim each part when it unlocks.',
    benefits: 'Fair staged payments for freelancers, builders, and projects without a middleman holding funds.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Lockbox', url: 'https://www.kasparex.com/dapps/lockbox' },
      { label: 'Silverscript', url: 'https://github.com/kaspanet/silverscript' },
    ],
    status: 'Mainnet',
    network: 'Kaspa L1 Covenants',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.2.0',
    description: 'Schedule KAS payments in milestones. Fund once, release on dates you set.',
    security: 'Staged release via milestone.sil and L1 covenant runtime.',
    roadmap: 'Done: Runtime wiring\nNext: Wallet mainnet covenant spends',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-crowdfund',
    name: 'Covenant Crowdfund',
    slug: 'covenant-crowdfund',
    featuredImage: 'https://static.wixstatic.com/media/de4185_a63eeb6e27244198868931c4a3c64dfd~mv2.jpg',
    category: 'general',
    utility: 'Raise KAS for a project with a clear goal and deadline. If you hit the goal, the creator gets the funds. If not, backers can get their money back.',
    process: 'Launch a campaign, collect pledges until the deadline. Creator claims if the goal is met; otherwise backers refund.',
    benefits: 'Trustworthy community raises for launches, drops, and shared projects on Kaspa.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'vDonate', url: 'https://www.kasparex.com/donations' },
      { label: 'Covenant Split', url: 'https://www.kasparex.com/dapps/covenant-split' },
      { label: 'Website', url: 'https://www.kasparex.com' },
    ],
    status: 'Mainnet',
    network: 'Kaspa L1 Covenants',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.2.0',
    description: 'Community crowdfunds with a funding goal, deadline, and automatic refund path if the goal is missed.',
    security: 'Hybrid L1 path in CrowdKAS and standalone widget; no Hub indexer.',
    roadmap: 'Done: CrowdKAS L1 panel + runtime\nNext: On-chain crowdfund.sil via wallet',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-voucher',
    name: 'Covenant Voucher',
    slug: 'covenant-voucher',
    featuredImage: 'https://static.wixstatic.com/media/de4185_55c355f226784eb8b6933b51463cbe7b~mv2.jpg',
    category: 'general',
    utility: 'Give KAS as a gift card. Lock the coins, share a secret code, and the recipient redeems before it expires.',
    process: 'Mint a voucher with an amount and expiry. Share the secret code privately. Recipient redeems once with that code.',
    benefits: 'Easy gifts, tips, and promo credits with a fixed expiry and single-use redemption.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Lockbox', url: 'https://www.kasparex.com/dapps/lockbox' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
    ],
    status: 'Mainnet',
    network: 'Kaspa L1 Covenants',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.2.0',
    description: 'Digital KAS gift cards with a secret code, expiry date, and one-time redemption.',
    security: 'Hashlock voucher.sil template; client-side voucher registry only.',
    roadmap: 'Done: Runtime + voucher.sil wiring\nNext: Wallet redeem txs on mainnet',
    createdAt: new Date().toISOString(),
  },
];

export interface FilterState {
  category: Category[];
  status: (DAppStatus | 'all')[];
  developer: (string | 'all')[];
  network: (string | 'all')[];
}

export const filterDAppsByCategory = (
  dapps: DApp[],
  category: Category
): DApp[] => {
  if (category === 'all') {
    return dapps;
  }
  return dapps.filter((dapp) => dapp.category === category);
};

export const filterDApps = (
  dapps: DApp[],
  filters: FilterState,
  searchQuery?: string
): DApp[] => {
  return dapps.filter((dapp) => {
    // Category filter - empty array means all selected
    if (filters.category.length > 0 && !filters.category.includes(dapp.category) && !filters.category.includes('all')) {
      return false;
    }

    // Status filter - empty array means all selected
    if (filters.status.length > 0 && !filters.status.includes(dapp.status) && !filters.status.includes('all')) {
      return false;
    }

    // Developer filter - empty array means all selected
    if (filters.developer.length > 0 && !filters.developer.includes(dapp.developer) && !filters.developer.includes('all')) {
      return false;
    }

    // Network filter - empty array means all selected
    if (filters.network.length > 0 && !filters.network.includes('all')) {
      const hasVProgsFilter = filters.network.includes('vProgs');
      const supportedChainIds = getDAppChainIds(dapp);
      const hasVProgs = supportedChainIds.includes(CHAIN_IDS.VPROGS_TESTNET) ||
        supportedChainIds.includes(CHAIN_IDS.VPROGS_MAINNET);

      // Check if dApp matches any selected network (OR logic)
      const matchesNetwork = filters.network.includes(dapp.network);
      const matchesVProgs = hasVProgsFilter && hasVProgs;

      // If neither network name nor vProgs compatibility matches, filter out
      if (!matchesNetwork && !matchesVProgs) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const searchableText = [
        dapp.name,
        dapp.utility,
        dapp.process,
        dapp.benefits,
        dapp.description,
        dapp.developer,
        dapp.category,
        dapp.status,
        dapp.network,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });
};

export const getCategoryCounts = (
  dapps: DApp[],
  filters: Omit<FilterState, 'category'>,
  searchQuery?: string
): Record<Category, number> => {
  const counts: Record<Category, number> = {
    all: 0,
    tracker: 0,
    general: 0,
    minting: 0,
    defi: 0,
    games: 0,
    promotion: 0,
    subscription: 0,
    dao: 0,
    tools: 0,
    collabs: 0,
    airdrops: 0,
    payment: 0,
  };

  // Filter dApps by status, developer, network, and search query (but not category)
  const filteredDApps = dapps.filter((dapp) => {
    // Status filter - empty array means all selected
    if (filters.status.length > 0 && !filters.status.includes(dapp.status) && !filters.status.includes('all')) {
      return false;
    }
    // Developer filter - empty array means all selected
    if (filters.developer.length > 0 && !filters.developer.includes(dapp.developer) && !filters.developer.includes('all')) {
      return false;
    }
    // Network filter - empty array means all selected
    if (filters.network.length > 0 && !filters.network.includes('all')) {
      const hasVProgsFilter = filters.network.includes('vProgs');
      const supportedChainIds = getDAppChainIds(dapp);
      const hasVProgs = supportedChainIds.includes(CHAIN_IDS.VPROGS_TESTNET) ||
        supportedChainIds.includes(CHAIN_IDS.VPROGS_MAINNET);

      // Check if dApp matches any selected network (OR logic)
      const matchesNetwork = filters.network.includes(dapp.network);
      const matchesVProgs = hasVProgsFilter && hasVProgs;

      // If neither network name nor vProgs compatibility matches, filter out
      if (!matchesNetwork && !matchesVProgs) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      const searchableText = [
        dapp.name,
        dapp.utility,
        dapp.process,
        dapp.benefits,
        dapp.description,
        dapp.developer,
        dapp.category,
        dapp.status,
        dapp.network,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Count by category
  filteredDApps.forEach((dapp) => {
    counts[dapp.category] = (counts[dapp.category] || 0) + 1;
  });

  // Count all
  counts.all = filteredDApps.length;

  return counts;
};

/**
 * Get all dApps (for marketplace listing)
 */
export function getAllDApps(): DApp[] {
  return placeholderDApps;
}

export const getDAppById = (dapps: DApp[], id: string): DApp | undefined => {
  return dapps.find((dapp) => dapp.id === id);
};

/**
 * Maps network name strings to supported chain IDs
 * 
 * @param network - Network name string from dApp data
 * @returns Array of chain IDs that support this network
 */
export function networkNameToChainIds(network: string): number[] {
  const networkLower = network.toLowerCase();

  if (networkLower.includes('kasplex')) {
    // Kasplex L2 networks - both mainnet and testnet
    return [CHAIN_IDS.KASPLEX_L2_MAINNET, CHAIN_IDS.KASPLEX_L2_TESTNET];
  }

  if (networkLower.includes('galleon')) {
    return [CHAIN_IDS.IGRA_GALLEON_TESTNET];
  }

  if (networkLower.includes('igra')) {
    return [CHAIN_IDS.IGRA_GALLEON_TESTNET, CHAIN_IDS.IGRA_MAINNET];
  }

  if (networkLower === 'testnet' || networkLower.includes('testnet')) {
    return [CHAIN_IDS.KASPLEX_L2_TESTNET, CHAIN_IDS.IGRA_GALLEON_TESTNET];
  }

  if (networkLower === 'mainnet' || networkLower.includes('mainnet')) {
    return [CHAIN_IDS.KASPLEX_L2_MAINNET, CHAIN_IDS.IGRA_MAINNET];
  }

  // Default: return empty array for unknown networks
  return [];
}

/**
 * Gets the supported chain IDs for a dApp.
 * If supportedChainIds is explicitly set, uses that.
 * Otherwise, infers from the network field.
 * 
 * @param dapp - The dApp to get chain IDs for
 * @returns Array of supported chain IDs
 */
export function getDAppChainIds(dapp: DApp): number[] {
  if (dapp.supportedChainIds && dapp.supportedChainIds.length > 0) {
    return dapp.supportedChainIds;
  }
  return networkNameToChainIds(dapp.network);
}

/**
 * Checks if a dApp is compatible with a given chain ID
 * 
 * @param dapp - The dApp to check
 * @param chainId - The chain ID to check compatibility with
 * @returns true if the dApp supports the chain ID
 */
export function isDAppCompatibleWithChain(dapp: DApp, chainId: number): boolean {
  const supportedChainIds = getDAppChainIds(dapp);
  return supportedChainIds.includes(chainId);
}

/**
 * Gets the network type (L1 or L2) for a dApp.
 * Uses networkType field if explicitly set, otherwise infers from network field.
 * 
 * @param dapp - The dApp to get network type for
 * @returns 'L1' for Kaspa native, 'L2' for EVM-compatible
 */
export function getDAppNetworkType(dapp: DApp): 'L1' | 'L2' {
  // If networkType is explicitly set, use it
  if (dapp.networkType) {
    return dapp.networkType;
  }

  // Otherwise, infer from network field
  const networkLower = dapp.network.toLowerCase();

  // If network contains "kasplex" or "igra", it's L2
  if (networkLower.includes('kasplex') || networkLower.includes('igra')) {
    return 'L2';
  }

  // Default to L1 for other networks (Kaspa native)
  return 'L1';
}

export type DAppNetworkFilter = 'all' | 'L1' | 'L2' | 'MULTI';

function getDAppChainNetworkKey(chainId: number): string {
  if (chainId === CHAIN_IDS.KASPLEX_L2_TESTNET) return 'kasplex-testnet';
  if (chainId === CHAIN_IDS.KASPLEX_L2_MAINNET) return 'kasplex-mainnet';
  if (chainId === CHAIN_IDS.IGRA_GALLEON_TESTNET) return 'igra-testnet';
  if (chainId === CHAIN_IDS.IGRA_MAINNET) return 'igra-mainnet';
  return `chain-${chainId}`;
}

export function isMultichainDApp(dapp: DApp): boolean {
  if (dapp.directoryListing?.networkLayer === 'multichain') return true;

  const chainIds = getDAppChainIds(dapp);
  if (chainIds.length < 2) return false;

  const networkKeys = new Set(chainIds.map(getDAppChainNetworkKey));
  return networkKeys.size >= 2;
}

export function isDirectoryListingDApp(dapp: DApp): boolean {
  return dapp.source === 'directory';
}

/** Resolve square logo URL for cards, tables, and detail headers. */
export function getDAppLogoSrc(
  dapp: Pick<DApp, 'logoImage' | 'image' | 'featuredImage' | 'directoryListing'>,
): string | undefined {
  if (dapp.logoImage?.trim()) return dapp.logoImage.trim();

  const listing = dapp.directoryListing;
  if (listing?.logoUrl?.trim()) return listing.logoUrl.trim();
  if (listing?.logoCid?.trim()) return getBestGatewayUrl(listing.logoCid.trim());

  const image = dapp.image?.trim();
  if (image) {
    const featured = dapp.featuredImage?.trim();
    if (!featured || image !== featured) return image;
  }

  return undefined;
}

export function isCovenantDApp(dapp: DApp): boolean {
  const slug = dapp.slug ?? '';
  return slug === 'lockbox' || slug.startsWith('covenant-');
}

export function matchesDAppNetworkFilter(dapp: DApp, filter: DAppNetworkFilter): boolean {
  if (filter === 'all') return true;
  if (isMultichainDApp(dapp)) return filter === 'MULTI';
  if (filter === 'MULTI') return false;
  return getDAppNetworkType(dapp) === filter;
}

/**
 * Get payment configuration for a dApp
 * Uses paymentConfig field if available, otherwise uses default configs
 * 
 * @param dapp - The dApp to get payment config for
 * @param networkType - The network type (L1 or L2)
 * @returns Payment configuration or null
 */
export function getDAppPaymentConfig(
  dapp: DApp,
  networkType: 'L1' | 'L2'
): import('./payments/config').PaymentConfig | null {
  // Import dynamically to avoid circular dependencies
  const { getDAppPaymentConfig: getPaymentConfig } = require('./payments/config');
  return getPaymentConfig(dapp, networkType);
}

/**
 * Generate a simulated contract address from a dApp ID
 * This creates a deterministic address based on the dApp ID
 */
export function generateSimulatedAddress(dappId: string): string {
  // Create a deterministic hash-like string from the dApp ID
  // This ensures the same dApp always gets the same address
  let hash = 0;
  for (let i = 0; i < dappId.length; i++) {
    const char = dappId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive number and pad to 40 hex characters (20 bytes)
  const positiveHash = Math.abs(hash);
  const hexString = positiveHash.toString(16).padStart(8, '0');

  // Repeat and pad to 40 characters for a full address
  const fullHex = (hexString.repeat(5) + hexString.substring(0, 8)).substring(0, 40);

  return `0x${fullHex}`;
}


