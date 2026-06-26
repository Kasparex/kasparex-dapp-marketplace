import type { AiAgent } from './types';

/** Placeholder catalog for layout and filtering. Real agents will wire to on-chain registry later. */
export const PLACEHOLDER_AI_AGENTS: AiAgent[] = [
  {
    id: 'research-agent',
    slug: 'research-agent',
    name: 'Research Agent',
    category: 'research',
    description: 'Deep web research, summarization, and citation-ready reports powered by autonomous reasoning loops.',
    token: 'KAS',
    creator: 'Kasparex AI',
    usageCount: 12400,
    rating: 4.8,
    reviewCount: 124,
    status: 'online',
    programmabilityReady: true,
  },
  {
    id: 'content-generator',
    slug: 'content-generator',
    name: 'Content Generator',
    category: 'content-creation',
    description: 'Draft articles, social posts, and vBlog-ready content with Kaspa-native publishing hooks.',
    token: 'KREX',
    creator: 'Kasparex AI',
    usageCount: 9800,
    rating: 4.7,
    reviewCount: 98,
    status: 'online',
  },
  {
    id: 'code-assistant',
    slug: 'code-assistant',
    name: 'Code Assistant',
    category: 'productivity',
    description: 'Silverscript-aware coding help, covenant simulators, and dApp scaffolding for Kaspa builders.',
    token: 'KAS',
    creator: 'Kasparex AI',
    usageCount: 15200,
    rating: 4.9,
    reviewCount: 210,
    status: 'online',
    programmabilityReady: true,
  },
  {
    id: 'data-analyst',
    slug: 'data-analyst',
    name: 'Data Analyst',
    category: 'research',
    description: 'Parse on-chain data, indexers, and ecosystem stats into actionable dashboards and briefs.',
    token: 'KREX',
    creator: 'Kasparex AI',
    usageCount: 7600,
    rating: 4.6,
    reviewCount: 67,
    status: 'online',
  },
  {
    id: 'trading-bot',
    slug: 'trading-bot',
    name: 'Trading Bot',
    category: 'finance',
    description: 'Strategy templates for KAS and KREX pairs with risk guardrails. Execution awaits L1 programmability.',
    token: 'KAS',
    creator: 'Kasparex AI',
    usageCount: 5400,
    rating: 4.5,
    reviewCount: 45,
    status: 'online',
  },
  {
    id: 'lifestyle-coach',
    slug: 'lifestyle-coach',
    name: 'Lifestyle Coach',
    category: 'lifestyle',
    description: 'Personal planning, habit tracking, and wellness nudges with optional GRID reward tie-ins.',
    token: 'KREX',
    creator: 'Kasparex AI',
    usageCount: 3200,
    rating: 4.4,
    reviewCount: 38,
    status: 'online',
  },
  {
    id: 'utility-helper',
    slug: 'utility-helper',
    name: 'Utility Helper',
    category: 'utilities',
    description: 'Wallet ops, fee estimates, and cross-module tasks across the Kasparex hub from one agent surface.',
    token: 'KAS',
    creator: 'Kasparex AI',
    usageCount: 8900,
    rating: 4.7,
    reviewCount: 112,
    status: 'online',
  },
  {
    id: 'aria-assistant',
    slug: 'aria-assistant',
    name: 'ARIA Assistant',
    category: 'utilities',
    description: 'Governance-aware agent for future ARIA token utility, voting summaries, and ecosystem coordination.',
    token: 'ARIA',
    creator: 'Kasparex AI',
    usageCount: 0,
    rating: 0,
    reviewCount: 0,
    status: 'soon',
  },
];

export function formatAgentUsage(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

export function filterAgentsByTab(
  agents: AiAgent[],
  tab: import('./types').AiListingTab,
  searchQuery: string,
): AiAgent[] {
  let filtered = agents;

  if (tab === 'my-agents') {
    filtered = [];
  } else if (tab !== 'all') {
    filtered = filtered.filter((a) => a.category === tab);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.token.toLowerCase().includes(q),
    );
  }

  return filtered;
}
