import { Category } from './categories';

export type DAppStatus = 
  | 'Mainnet'
  | 'Testnet'
  | 'Concept'
  | 'Prototype'
  | 'U/C'
  | 'Suspended'
  | 'Devnet';

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
}

// Placeholder dApps for template demonstration
export const placeholderDApps: DApp[] = [
  {
    id: '1',
    name: 'Subscription Checker',
    category: 'subscription',
    utility: 'Let users pay monthly in KAS or KRC-20 tokens to access content.',
    process: 'Contract verifies payment and unlocks pages or tools.',
    benefits: 'Recurring revenue model for content creators.',
    developer: 'Kasparex',
    developerLinks: [
      { label: 'Website', url: 'https://www.kasparex.com' },
      { label: 'Telegram', url: 'https://t.me/kasparex' },
      { label: 'X (Twitter)', url: 'https://x.com/kasparex' },
    ],
    status: 'Prototype',
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
    status: 'Concept',
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
    status: 'Concept',
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
    status: 'U/C',
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
    status: 'Prototype',
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
    developer: 'KasFyi',
    status: 'Concept',
    network: 'Testnet',
    provider: 'KasFyi',
    version: 'V 1.0',
    description: 'Enable anonymous feedback collection from community members with a small KAS fee per message to prevent spam.',
  },
];

export interface FilterState {
  category: Category;
  status: DAppStatus | 'all';
  developer: string | 'all';
  network: string | 'all';
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
    // Category filter
    if (filters.category !== 'all' && dapp.category !== filters.category) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all' && dapp.status !== filters.status) {
      return false;
    }
    
    // Developer filter
    if (filters.developer !== 'all' && dapp.developer !== filters.developer) {
      return false;
    }
    
    // Network filter
    if (filters.network !== 'all' && dapp.network !== filters.network) {
      return false;
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
  };

  // Filter dApps by status, developer, network, and search query (but not category)
  const filteredDApps = dapps.filter((dapp) => {
    if (filters.status !== 'all' && dapp.status !== filters.status) {
      return false;
    }
    if (filters.developer !== 'all' && dapp.developer !== filters.developer) {
      return false;
    }
    if (filters.network !== 'all' && dapp.network !== filters.network) {
      return false;
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

export const getDAppById = (dapps: DApp[], id: string): DApp | undefined => {
  return dapps.find((dapp) => dapp.id === id);
};

