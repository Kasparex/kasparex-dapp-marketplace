export type KnowledgeBaseCategory = 
  | 'getting-started'
  | 'krex-nodes'
  | 'api'
  | 'rewards'
  | 'glossary'
  | 'troubleshooting'
  | 'advanced';

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  description: string;
  category: KnowledgeBaseCategory;
  slug: string;
  content?: string; // Full article content
}

export const knowledgeBaseCategories: Array<{
  id: KnowledgeBaseCategory;
  name: string;
  description: string;
}> = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Introduction and basics',
  },
  {
    id: 'krex-nodes',
    name: 'KREX Nodes',
    description: 'Node setup and management',
  },
  {
    id: 'api',
    name: 'Kasparex API',
    description: 'API documentation and guides',
  },
  {
    id: 'rewards',
    name: 'Rewards',
    description: 'GRID and multipliers',
  },
  {
    id: 'glossary',
    name: 'Glossary',
    description: 'Terms and definitions',
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and solutions',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Advanced topics and guides',
  },
];

export const knowledgeBaseArticles: KnowledgeBaseArticle[] = [
  {
    id: 'what-is-kasparex',
    title: 'What is Kasparex?',
    description: 'An introduction to the Kasparex dApp Marketplace and ecosystem.',
    category: 'getting-started',
    slug: 'what-is-kasparex',
  },
  {
    id: 'krex-node-overview',
    title: 'KREX Node Overview',
    description: 'Learn about KREX Nodes and how they support the Kasparex network.',
    category: 'krex-nodes',
    slug: 'krex-node-overview',
  },
  {
    id: 'krex-node-setup',
    title: 'Setting Up a KREX Node',
    description: 'Step-by-step guide to setting up and running your first KREX Node.',
    category: 'krex-nodes',
    slug: 'krex-node-setup',
  },
  {
    id: 'krex-node-rewards',
    title: 'KREX Node Rewards',
    description: 'Understanding how rewards work for KREX Node operators.',
    category: 'rewards',
    slug: 'krex-node-rewards',
  },
  {
    id: 'api-overview',
    title: 'Kasparex API Overview',
    description: 'Introduction to the Kasparex API and its role in the ecosystem.',
    category: 'api',
    slug: 'api-overview',
  },
  {
    id: 'api-endpoints',
    title: 'API Endpoints Reference',
    description: 'Complete reference for all Kasparex API endpoints.',
    category: 'api',
    slug: 'api-endpoints',
  },
  {
    id: 'grid-token',
    title: 'GRID Token',
    description: 'Learn about the GRID (Global Reward Token) and its uses.',
    category: 'rewards',
    slug: 'grid-token',
  },
  {
    id: 'lrt-tokens',
    title: 'Earning GRID',
    description: 'How to earn and use GRID rewards across the ecosystem.',
    category: 'rewards',
    slug: 'lrt-tokens',
  },
  {
    id: 'krex-multipliers',
    title: 'KREX Multipliers',
    description: 'How KREX holdings affect your rewards and multipliers.',
    category: 'rewards',
    slug: 'krex-multipliers',
  },
  {
    id: 'blockdag-explained',
    title: 'What is a BlockDAG?',
    description: 'Understanding Kaspa\'s BlockDAG architecture and how it differs from blockchain.',
    category: 'glossary',
    slug: 'blockdag-explained',
  },
  {
    id: 'vprogs-explained',
    title: 'Verifiable Programs (vProgs)',
    description: 'Learn about Kaspa\'s verifiable programs and their role in the ecosystem.',
    category: 'glossary',
    slug: 'vprogs-explained',
  },
  {
    id: 'node-troubleshooting',
    title: 'KREX Node Troubleshooting',
    description: 'Common issues and solutions for KREX Node operators.',
    category: 'troubleshooting',
    slug: 'node-troubleshooting',
  },
  {
    id: 'api-troubleshooting',
    title: 'API Connection Issues',
    description: 'Troubleshooting guide for API connection problems.',
    category: 'troubleshooting',
    slug: 'api-troubleshooting',
  },
  {
    id: 'advanced-node-config',
    title: 'Advanced Node Configuration',
    description: 'Advanced configuration options for power users.',
    category: 'advanced',
    slug: 'advanced-node-config',
  },
  {
    id: 'kpx-v1-overview',
    title: 'kpx v1 Overview',
    description: 'Kaspa-wide kpx protocol family: identity + commits, deterministic rules, and design goals.',
    category: 'advanced',
    slug: 'kpx-v1-overview',
  },
  {
    id: 'kpx-v1-verified-badge',
    title: 'kpx/ver v1 Verified Badge',
    description: 'A minimal boolean verified badge record and how indexers resolve it.',
    category: 'advanced',
    slug: 'kpx-v1-verified-badge',
  },
  {
    id: 'kpx-v1-linking',
    title: 'kpx/lnk v1 Linking (Kaspa ↔ EVM)',
    description: 'How kpx link records support hybrid auth while keeping Kaspa as the canonical principal.',
    category: 'advanced',
    slug: 'kpx-v1-linking',
  },
  {
    id: 'kpx-v1-commits',
    title: 'kpx/cm v1 Commits',
    description: 'Global commit records for creator-owned resources: rt/rid/contentHash + fee policies.',
    category: 'advanced',
    slug: 'kpx-v1-commits',
  },
  {
    id: 'ipfs-storacha',
    title: 'IPFS and Storacha',
    description: 'Understanding decentralized storage in the Kasparex ecosystem.',
    category: 'glossary',
    slug: 'ipfs-storacha',
  },
];

export function getArticlesByCategory(category: KnowledgeBaseCategory | 'all'): KnowledgeBaseArticle[] {
  if (category === 'all') {
    return knowledgeBaseArticles;
  }
  return knowledgeBaseArticles.filter(article => article.category === category);
}

export function getArticleBySlug(slug: string): KnowledgeBaseArticle | undefined {
  return knowledgeBaseArticles.find(article => article.slug === slug);
}

export function getCategoryById(id: KnowledgeBaseCategory) {
  return knowledgeBaseCategories.find(cat => cat.id === id);
}

