import { Category } from './categories';
import { CHAIN_IDS } from './wagmi';

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
}

// Placeholder dApps for template demonstration
export const placeholderDApps: DApp[] = [
  {
    id: '8',
    name: 'Voting Tournament Tool',
    category: 'tools',
    utility: 'Launch bracket-style community tournaments.',
    process: 'Users vote on pairings via token contract.',
    benefits: 'Engaging community competitions.',
    developer: 'Kasparex',
    status: 'Mainnet',
    network: 'Testnet',
    networkType: 'L2',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'Create and manage bracket-style voting tournaments where community members vote on pairings using token-based contracts.',
  },
  {
    id: '11',
    name: 'Simple Payment',
    slug: 'simple-payment',
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
    id: 'genesis-badge',
    name: 'Genesis Badge',
    slug: 'genesis-badge',
    featuredImage: 'https://static.wixstatic.com/media/de4185_e24452baae844a969d86c5fee890c56f~mv2.png',
    category: 'general',
    utility: 'Unlock a unique genesis badge (random theme and title) or boost your existing badge. Each action supports the Revenue Tree and earns tGRID and pts.',
    process: 'Pay 10 iKAS to unlock a random badge (first time) or boost your badge (subsequent). Revenue splits through the tree; you receive tGRID and pts with your multiplier.',
    benefits: 'Unique on-chain badge, boost progress, tGRID and pts rewards, Revenue Tree integration. Same user can use unlimited times.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Mainnet',
    network: 'Igra Mainnet',
    networkType: 'L2',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'Genesis Badge lets you unlock a unique random badge (theme and title) for 10 iKAS, then boost it with more payments. All payments flow through the Revenue Tree and reward you with GRID and pts on Igra Mainnet.',
    supportedChainIds: [38833],
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
    id: 'genesis',
    name: 'Genesis Dapp',
    slug: 'genesis-dapp',
    featuredImage: 'https://static.wixstatic.com/media/de4185_b61099fdcceb4aec951bc343ebb19e41~mv2.png/v1/fill/w_790,h_528,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/de4185_b61099fdcceb4aec951bc343ebb19e41~mv2.png',
    category: 'general',
    utility: 'Leave a permanent message on-chain, creating a time capsule of the early Kaspa ecosystem.',
    process: 'Connect wallet, write your message (max 280 characters), pay 0.01 KAS fee, and your message is permanently stored.',
    benefits: 'Be part of Kaspa history. Your message will be forever recorded on-chain as one of the first participants.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kaspa vProgs (Simulator)',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description: 'Genesis Dapp is the first dApp on Kasparex Hub, built with vProgs framework for native Kaspa Layer 1. Leave a permanent message on-chain and become part of Kaspa history.',
    security: 'Built with vProgs framework. All messages are permanently stored on-chain using vProgs state management. Currently running on simulator, will migrate to production vProgs when ready.',
    roadmap: 'Q1 2025: Simulator implementation\nQ2 2025: vProgs integration when framework is ready\nQ3 2025: Production deployment on Kaspa L1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-lab',
    name: 'Covenant Lab',
    slug: 'covenant-lab',
    category: 'general',
    utility: 'Lock KAS for someone with simple rules: release anytime (escrow) or only after a date (timelock).',
    process: 'Choose escrow or timelock, set who receives the KAS and how much, then create the lock. They claim when the rules allow.',
    benefits: 'Safe handoffs for trades, freelance work, and savings without a third party holding funds.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Silverscript', url: 'https://github.com/kaspanet/silverscript' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kaspa L1 Covenants (Simulator)',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description:
      'Lock KAS with escrow or timelock rules. Hold coins for someone until they can claim on your terms.',
    security:
      'Prototype only. Vault state is simulated locally until covenant txs are supported in wallets. Optional L1 payment sends KAS to a configured treasury with a binding note.',
    roadmap:
      'Phase 1: Simulator + treasury binding (now)\nPhase 2: TN12 Silverscript lockbox.sil\nPhase 3: Mainnet covenant txs post-Toccata',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-split',
    name: 'Covenant Split',
    slug: 'covenant-split',
    featuredImage: 'https://static.wixstatic.com/media/de4185_2a64df8a87f7479b8f5ec6db8f726a1a~mv2.png',
    category: 'general',
    utility: 'Split one KAS payment across multiple people with fixed percentage shares.',
    process: 'Set the total amount, add recipients with shares (must total 100%), fund once. Each person claims their part.',
    benefits: 'Team payouts, revenue sharing, and prize pools without trusting someone to divide the money manually.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Covenant Lab', url: 'https://www.kasparex.com/dapps/covenant-lab' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kaspa L1 Covenants (Simulator)',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description:
      'Divide one KAS payment among several addresses. Lock once, set each share, and let everyone claim independently.',
    security:
      'Prototype only. Share enforcement is simulated until Silverscript fan-out covenants deploy post-Toccata.',
    roadmap:
      'Phase 1: Simulator + split commit notes (now)\nPhase 2: split-payment.sil on TN12\nPhase 3: Wallet covenant fan-out txs',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-milestone',
    name: 'Covenant Milestone',
    slug: 'covenant-milestone',
    category: 'general',
    utility: 'Pay in steps: lock the full amount, release each part on the dates you choose.',
    process: 'Set who gets paid, split the total into milestones, and fund once. They claim each part when it unlocks.',
    benefits: 'Fair staged payments for freelancers, builders, and projects without a middleman holding funds.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Covenant Lab', url: 'https://www.kasparex.com/dapps/covenant-lab' },
      { label: 'Silverscript', url: 'https://github.com/kaspanet/silverscript' },
    ],
    status: 'Testnet',
    network: 'Kaspa L1 Covenants (Simulator)',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description: 'Schedule KAS payments in milestones. Fund once, release on dates you set.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-crowdfund',
    name: 'Covenant Crowdfund',
    slug: 'covenant-crowdfund',
    category: 'general',
    utility: 'Raise KAS with a clear goal and deadline. All-or-nothing: succeed or backers get refunds.',
    process: 'Launch a campaign, collect pledges until the deadline. Creator claims if the goal is met; otherwise backers refund.',
    benefits: 'Trustworthy community raises for launches, drops, and shared projects on Kaspa.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'CrowdKAS', url: 'https://www.kasparex.com/donations' },
      { label: 'Covenant Split', url: 'https://www.kasparex.com/dapps/covenant-split' },
      { label: 'Website', url: 'https://www.kasparex.com' },
    ],
    status: 'Testnet',
    network: 'Kaspa L1 Covenants (Simulator)',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description: 'Community crowdfunds with a funding goal, deadline, and automatic refund path if the goal is missed.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'covenant-voucher',
    name: 'Covenant Voucher',
    slug: 'covenant-voucher',
    featuredImage: 'https://static.wixstatic.com/media/de4185_23301ff16be4426b842bd69c11d6035d~mv2.png',
    category: 'general',
    utility: 'KAS gift cards: lock coins, share a secret code, recipient redeems before expiry.',
    process: 'Mint a voucher with an amount and expiry. Share the secret code privately. Recipient redeems once with that code.',
    benefits: 'Easy gifts, tips, and promo credits with a fixed expiry and single-use redemption.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Covenant Lab', url: 'https://www.kasparex.com/dapps/covenant-lab' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kaspa L1 Covenants (Simulator)',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description: 'Digital KAS gift cards with a secret code, expiry date, and one-time redemption.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'kasparex-ai',
    name: 'Kasparex AI',
    slug: 'kasparex-ai',
    category: 'tools',
    utility: 'Build and deploy autonomous AI agents on Kaspa L1 BlockDAG.',
    process: 'Browse agents, compose workflows, and settle actions with KAS, KREX, or future ARIA tokens.',
    benefits: 'Open agent infrastructure adapted from OpenServ patterns for the Kasparex ecosystem.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'OpenServ Labs', url: 'https://github.com/openserv-labs' },
      { label: 'Hub', url: 'https://www.kasparex.com/hub' },
    ],
    status: 'Testnet',
    network: 'Kaspa L1 BlockDAG',
    networkType: 'L1',
    provider: 'Kasparex',
    version: '0.1.0',
    description:
      'Kasparex AI is the hub for autonomous agents on Kaspa L1. Layout-first release with agent catalog, workflow templates, MPC hooks, and programmability placeholders for native L1 scripts.',
    url: '/ai',
    roadmap:
      'Phase 1: Layout and catalog (now)\nPhase 2: Agent SDK and wallet deployment\nPhase 3: L1 programmability and ARIA governance',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'revenue-tree',
    name: 'Revenue Tree',
    slug: 'revenue-tree',
    category: 'tracker',
    utility: 'Track your network, rewards, and structural flow in real-time.',
    process: 'Log in with your wallet to view your personal revenue tree and referral network.',
    benefits: 'Real-time visualization of your referral structure and reward distribution.',
    developer: 'Kasparex',
    status: 'Mainnet',
    network: 'Multiple Clusters',
    networkType: 'L2',
    provider: 'Kasparex',
    version: '1.2.0',
    description: 'The Revenue Tree Dashboard is your mission control for the Kasparex ecosystem. Monitor your network growth, track coming rewards, and visualize how value flows through your structural levels.',
    url: '/dashboard',
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

/**
 * Generate a simulated token ticker from a dApp name
 * This is used as a fallback when contract data doesn't have a ticker
 */
export function generateSimulatedTicker(dappName: string): string {
  // Remove common words and special characters
  const cleaned = dappName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Special cases for known dApps
  const specialCases: Record<string, string> = {
    'DAO VOTING': 'VOTE',
    'SIMPLE PAYMENT': 'PAY',
    'VOTING TOURNAMENT TOOL': 'TOURNAMENT',
    'SEND KAS': 'KAS',
    'SEND KREX': 'KREX',
  };

  if (specialCases[cleaned]) {
    return specialCases[cleaned];
  }

  // Extract meaningful words (skip common words)
  const words = cleaned.split(' ').filter(word => {
    const commonWords = ['THE', 'A', 'AN', 'TO', 'FOR', 'OF', 'AND', 'OR', 'IN', 'ON', 'AT', 'BY'];
    return word.length > 2 && !commonWords.includes(word);
  });

  if (words.length === 0) {
    // Fallback: use first 3-4 letters of the name
    return cleaned.substring(0, 4).replace(/\s/g, '');
  }

  if (words.length === 1) {
    // Single word: use first 3-4 letters
    return words[0].substring(0, 4);
  }

  // Multiple words: use first letter of each word (up to 4 words)
  const initials = words.slice(0, 4).map(word => word[0]).join('');

  // If we have 2-3 words, try to use first 2 letters of first word + first letter of others
  if (words.length === 2 || words.length === 3) {
    const firstWord = words[0];
    if (firstWord.length >= 2) {
      return (firstWord.substring(0, 2) + words.slice(1).map(w => w[0]).join('')).substring(0, 5);
    }
  }

  const result = initials.substring(0, 5);

  // Limit to 6 characters max
  return result.substring(0, 6);
}


