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
}

// Placeholder dApps for template demonstration
export const placeholderDApps: DApp[] = [
  {
    id: '1',
    name: 'Subscription Checker',
    category: 'subscription',
    utility: 'Let users pay monthly in KAS to access content.',
    process: 'Contract verifies payment and unlocks pages or tools.',
    benefits: 'Recurring revenue model for content creators.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'A subscription-based access control system for Kaspa dApps and content platforms.',
  },
  {
    id: '2',
    name: 'Token Payment Splitter',
    category: 'minting',
    utility: 'Split incoming payments among team members.',
    process: 'Routes percentages to preset wallet addresses.',
    benefits: 'Use for collabs, revenue shares, royalties.',
    developer: 'Kasparex',
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'Automatically distribute token payments across multiple recipients based on predefined percentages.',
  },
  {
    id: '3',
    name: 'Multi-Choice Voting Panel',
    category: 'dao',
    utility: 'Pay a small fee to cast a vote in community decisions.',
    process: 'KAS fee required per vote; vote weight based on holdings.',
    benefits: 'Democratic governance for token communities.',
    developer: 'Kasparex',
    status: 'Mainnet',
    network: 'Mainnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'Enable decentralized governance through token-weighted voting on Kaspa network.',
  },
  {
    id: '4',
    name: 'Idea Submission Box',
    category: 'subscription',
    utility: 'Community submits ideas tied to wallet.',
    process: 'Stores short text string per address.',
    benefits: 'Collective brainpower.',
    developer: 'Kasparex',
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'A Web3 idea submission system where community members can share and track ideas linked to their wallet addresses.',
  },
  {
    id: '5',
    name: 'Custom dApp Page Builder',
    category: 'airdrops',
    utility: 'Launch a micro-site for your token with one click.',
    process: 'Reads metadata, renders content with templates.',
    benefits: 'Instant branded pages for token projects.',
    developer: 'Kasparex',
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'Build custom dApp homepages effortlessly by reading token metadata and rendering content with customizable templates.',
  },
  {
    id: '6',
    name: 'Token Profile Page',
    category: 'dao',
    utility: 'Create verified token project profiles on Kasparex.',
    process: 'Contract verifies ownership and deploys the page.',
    benefits: 'Verified project presence and credibility.',
    developer: 'Kasparex',
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'Create and verify token project profiles on Kasparex with on-chain ownership verification.',
  },
  {
    id: '7',
    name: 'Hold-to-View Threads',
    category: 'general',
    utility: 'Reveal replies or deep content only to holders.',
    process: 'Verifies holding before expanding UI.',
    benefits: 'Exclusive content for token holders.',
    developer: 'Kasparex',
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'Hold-to-view content system that reveals replies and deep content only to verified token holders.',
  },
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
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'Create and manage bracket-style voting tournaments where community members vote on pairings using token-based contracts.',
  },
  {
    id: '9',
    name: 'Token Milestone Logger',
    category: 'general',
    utility: 'Log major token events (DEX listing, 10k holders).',
    process: 'Each event recorded via wallet signature.',
    benefits: 'On-chain milestone tracking.',
    developer: 'KasTools',
    status: 'Testnet',
    network: 'Mainnet',
    provider: 'KasTools',
    version: 'V 1.0',
    description: 'Record and track major token milestones on-chain, including DEX listings, holder milestones, and significant events.',
  },
  {
    id: '10',
    name: 'Anonymous Feedback Box',
    category: 'promotion',
    utility: 'Lets users send anonymous feedback to project team.',
    process: 'Small KAS fee to send message.',
    benefits: 'Honest community feedback without fear.',
    developer: 'Kasparex',
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: 'V 1.0',
    description: 'Enable anonymous feedback collection from community members with a small KAS fee per message to prevent spam.',
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
    network: 'Kasplex L2 Testnet',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'Simple Payment is the first dApp on Kasparex, demonstrating our fee collection and revenue distribution system. Send KAS payments with a transparent 1% fee that supports platform development.',
    security: 'Built with OpenZeppelin contracts for security. All smart contracts use ReentrancyGuard to prevent reentrancy attacks. Fee collection is automated and transparent. Contracts are audited and follow best practices for EVM development.',
    roadmap: 'Q4 2025: Testnet launch and initial testing\nQ1 2026: Mainnet deployment\nQ2 2026: Enhanced features including batch payments and payment scheduling\nQ3 2026: Integration with Token Builder for automatic utility attachment',
    createdAt: '2025-11-05T16:21:29.306Z',
    supportedChainIds: [167012], // Kasplex L2 Testnet
    // Contract address will be fetched from environment variables via getContractAddress
    // deployerAddress will be fetched from DAppRegistry contract
  },
  {
    id: '12',
    name: 'DAO Voting',
    slug: 'dao-voting',
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
    network: 'Kasplex L2',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'DAO Voting enables community members to submit dApp ideas and vote on them. All proposals and votes are stored on-chain. Proposals that reach the vote threshold are automatically flagged for marketplace review.',
    security: 'Built with OpenZeppelin contracts for security. All smart contracts use ReentrancyGuard to prevent reentrancy attacks. Fee collection is automated and transparent.',
    roadmap: 'Q4 2025: Testnet launch and initial testing\nQ1 2026: Mainnet deployment\nQ2 2026: Enhanced features including proposal categories and advanced filtering\nQ3 2026: Integration with marketplace for automatic listing of approved proposals',
    createdAt: new Date().toISOString(),
    supportedChainIds: [167012, 202555, 19416], // Kasplex L2 Testnet, Mainnet, and Igra Caravel Testnet
    // Contract address will be fetched from environment variables via getContractAddress
    // deployerAddress will be fetched from DAppRegistry contract
  },
  {
    id: '14',
    name: 'Quiz-to-Earn',
    slug: 'quiz-to-earn',
    category: 'education',
    utility: 'Answer crypto and ecosystem questions to earn GRID or token rewards',
    process: 'Select a question, choose your answer, and submit. Correct answers earn rewards automatically.',
    benefits: 'Learn about Kaspa and blockchain technology while earning rewards. Educational gamification with on-chain rewards.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Testnet',
    network: 'Kasplex L2',
    provider: 'Kasparex',
    version: '1.0.0',
    description: 'Quiz-to-Earn is a gamified learning platform where users answer questions about Kaspa, blockchain technology, and the ecosystem to earn rewards. Each correct answer earns GRID or token rewards, tracked on-chain through Proof-of-Utility.',
    security: 'Built with OpenZeppelin contracts for security. All smart contracts use ReentrancyGuard to prevent reentrancy attacks. Questions and answers are stored on-chain for transparency. Rewards are distributed automatically through the RewardManager.',
    roadmap: 'Q4 2025: Testnet launch with initial question set\nQ1 2026: Mainnet deployment\nQ2 2026: Community question submission and moderation\nQ3 2026: Advanced features including streaks, leaderboards, and categories',
    createdAt: new Date().toISOString(),
    supportedChainIds: [167012, 19416], // Kasplex L2 Testnet and Igra Caravel Testnet
    // Contract address will be fetched from environment variables via getContractAddress
    // deployerAddress will be fetched from DAppRegistry contract
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
  
  if (networkLower.includes('igra')) {
    // Igra L2 networks - currently only testnet available
    return [CHAIN_IDS.IGRA_CARAVEL_TESTNET];
  }
  
  if (networkLower === 'testnet' || networkLower.includes('testnet')) {
    // Generic testnet - includes both testnets
    return [CHAIN_IDS.KASPLEX_L2_TESTNET, CHAIN_IDS.IGRA_CARAVEL_TESTNET];
  }
  
  if (networkLower === 'mainnet' || networkLower.includes('mainnet')) {
    // Generic mainnet - currently only Kasplex L2 Mainnet
    return [CHAIN_IDS.KASPLEX_L2_MAINNET];
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


