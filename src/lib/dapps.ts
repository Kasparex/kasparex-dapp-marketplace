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

export const filterDAppsByCategory = (
  dapps: DApp[],
  category: Category
): DApp[] => {
  if (category === 'all') {
    return dapps;
  }
  return dapps.filter((dapp) => dapp.category === category);
};

export const getDAppById = (dapps: DApp[], id: string): DApp | undefined => {
  return dapps.find((dapp) => dapp.id === id);
};

