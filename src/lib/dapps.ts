import { Category } from './categories';

export type DAppStatus = 
  | 'Mainnet'
  | 'Testnet'
  | 'Concept'
  | 'Prototype'
  | 'U/C'
  | 'Suspended'
  | 'Devnet';

export interface DApp {
  id: string;
  name: string;
  image?: string;
  category: Category;
  utility: string;
  process: string;
  benefits: string;
  developer: string;
  status: DAppStatus;
  network: string;
  provider: string;
  url?: string;
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
  filters: FilterState
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
    
    return true;
  });
};

export const getCategoryCounts = (
  dapps: DApp[],
  filters: Omit<FilterState, 'category'>
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

  // Filter dApps by status, developer, and network (but not category)
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

