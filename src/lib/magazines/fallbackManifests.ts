import type { MagazineIssueManifestV2 } from './manifest';

/** Offline demo manifests when IPFS CIDs are placeholders. */
const FALLBACK_BY_ISSUE_ID: Record<string, MagazineIssueManifestV2> = {
  'mag-kaspa-insider-1': {
    version: 2,
    magazineId: 'mag-kaspa-insider',
    magazineSlug: 'kaspa-insider',
    issueNumber: 1,
    title: 'Genesis: The Rise of Kaspa',
    priceKAS: 10,
    treasurySplitPct: 5,
    contributors: [
      { address: 'kaspa:qauthor1', role: 'Author', sharePercentage: 50 },
      { address: 'kaspa:qeditor1', role: 'Editor', sharePercentage: 25 },
      { address: 'kaspa:qdesigner1', role: 'Designer', sharePercentage: 20 },
      { address: 'kaspa:qtreasury123', role: 'Treasury', sharePercentage: 5 },
    ],
    sections: [
      { type: 'header', content: 'Genesis' },
      {
        type: 'text',
        content:
          'In-depth coverage of Kaspa launch, the GHOSTDAG protocol, and the vision for the fastest BlockDAG. This issue explores how Kaspa rethinks consensus for high throughput without sacrificing security.',
      },
      { type: 'vblog_article', slug: 'welcome-to-kasparex-vblog', includePremium: false },
      { type: 'header', content: 'Technical foundations' },
      { type: 'vblog_article', slug: 'understanding-cids-and-decentralized-storage', includePremium: false },
    ],
    authoredBy: 'kaspa:qeditorial_treasury',
    publishedAt: '2025-10-15T12:00:00Z',
  },
  'mag-kaspa-insider-2': {
    version: 2,
    magazineId: 'mag-kaspa-insider',
    magazineSlug: 'kaspa-insider',
    issueNumber: 2,
    title: 'The 10 BPS Era',
    priceKAS: 15,
    treasurySplitPct: 5,
    contributors: [
      { address: 'kaspa:qauthor2', role: 'Author', sharePercentage: 55 },
      { address: 'kaspa:qdesigner1', role: 'Designer', sharePercentage: 40 },
      { address: 'kaspa:qtreasury123', role: 'Treasury', sharePercentage: 5 },
    ],
    sections: [
      { type: 'header', content: 'Performance at scale' },
      {
        type: 'text',
        content:
          'Technical deep dive into the 10 blocks per second upgrade and what it means for scalability, mempool behavior, and real-world dApp throughput on Kaspa.',
      },
      { type: 'vblog_article', slug: 'understanding-cids-and-decentralized-storage', includePremium: false },
    ],
    authoredBy: 'kaspa:qeditorial_treasury',
    publishedAt: '2026-01-20T12:00:00Z',
  },
  'mag-krc20-1': {
    version: 2,
    magazineId: 'mag-krc20',
    magazineSlug: 'krc20-magazine',
    issueNumber: 1,
    title: 'Welcome to KRC20',
    priceKAS: 20,
    treasurySplitPct: 5,
    contributors: [
      { address: 'kaspa:qkrex', role: 'Author', sharePercentage: 95 },
      { address: 'kaspa:qtreasury123', role: 'Treasury', sharePercentage: 5 },
    ],
    sections: [
      { type: 'header', content: 'KRC20 on Kaspa' },
      {
        type: 'text',
        content:
          'Discover the world of KRC20 tokens, the legends behind them, and how to get started in the new era of Kaspa-native assets.',
      },
      { type: 'vblog_article', slug: 'welcome-to-kasparex-vblog', includePremium: false },
    ],
    authoredBy: 'kaspa:qkrex_official',
    publishedAt: '2026-02-06T12:00:00Z',
  },
};

export function getFallbackManifestForIssue(issueId: string): MagazineIssueManifestV2 | null {
  return FALLBACK_BY_ISSUE_ID[issueId] ?? null;
}
