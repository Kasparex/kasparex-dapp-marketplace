/**
 * Kasparex Protocols hub — catalog entries for listing, filters, and deep links.
 * Kinds map to sidebar buckets; URL ?kind= uses the same ids (comma-separated for OR).
 */

export type ProtocolHubBucket =
  | 'protocol'
  | 'tool'
  | 'use-case'
  | 'documentation'
  | 'implementation';

export type ProtocolHubMaturity = 'draft' | 'beta' | 'stable';

export interface ProtocolHubItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  href: string;
  bucket: ProtocolHubBucket;
  /** Logical suite (for future multi-protocol hubs). */
  suite: 'kpx' | 'kasparex';
  maturity: ProtocolHubMaturity;
}

export const PROTOCOL_HUB_ITEMS: ProtocolHubItem[] = [
  {
    id: 'kpx-v1-overview',
    title: 'kpx v1 — overview',
    subtitle: 'Kaspa-wide identity & creator payloads',
    description: 'How kpx v1 encodes portable JSON on Kaspa transactions so wallets and indexers agree on meaning.',
    href: '/knowledge-base/kpx-v1-overview',
    bucket: 'documentation',
    suite: 'kpx',
    maturity: 'draft',
  },
  {
    id: 'kpx-pf',
    title: 'Public profile (kpx/pf)',
    subtitle: 'Display name, bio, tags',
    description: 'Human-readable public fields bound to your Kaspa address, carried as a small on-chain payload.',
    href: '/knowledge-base/kpx-v1-overview',
    bucket: 'protocol',
    suite: 'kpx',
    maturity: 'draft',
  },
  {
    id: 'kpx-ver',
    title: 'Verified badge (kpx/ver)',
    subtitle: 'On-chain verified flag',
    description: 'Signals verification intent on-chain; apps may apply additional policy before showing badges in UI.',
    href: '/knowledge-base/kpx-v1-verified-badge',
    bucket: 'protocol',
    suite: 'kpx',
    maturity: 'draft',
  },
  {
    id: 'kpx-lnk',
    title: 'Kaspa ↔ EVM link (kpx/lnk)',
    subtitle: 'Bind L1 to an Ethereum address',
    description: 'Store a standard 0x address next to your Kaspa identity for bridges, payouts, and cross-chain UX.',
    href: '/knowledge-base/kpx-v1-linking',
    bucket: 'protocol',
    suite: 'kpx',
    maturity: 'draft',
  },
  {
    id: 'kpx-cm',
    title: 'Content commits (kpx/cm)',
    subtitle: 'Fingerprints for blogs, dApps, games…',
    description: 'Anchor a 64-hex content hash to an id and version line so mirrors and indexers can prove integrity.',
    href: '/knowledge-base/kpx-v1-commits',
    bucket: 'protocol',
    suite: 'kpx',
    maturity: 'draft',
  },
  {
    id: 'kpx-broadcast-tool',
    title: 'Post identity updates',
    subtitle: 'Wallet-friendly broadcast form',
    description: 'Compose, validate, and send kpx payloads with KasWare or Kastle — self-send flow with optional priority fee.',
    href: '/protocols/kpx-tools',
    bucket: 'tool',
    suite: 'kpx',
    maturity: 'beta',
  },
  {
    id: 'kpx-machine-spec',
    title: 'Machine-readable kpx spec',
    subtitle: 'JSON schema for integrators',
    description: 'Canonical field list and types served by Kasparex for wallets, indexers, and third-party dApps.',
    href: '/api/kpx/spec',
    bucket: 'implementation',
    suite: 'kpx',
    maturity: 'beta',
  },
  {
    id: 'usecase-self-custody',
    title: 'Self-custody identity updates',
    subtitle: 'You keep the keys',
    description: 'Publish profile, links, and fingerprints without a custodian: the wallet signs, Kaspa stores, indexers aggregate.',
    href: '/protocols/kpx#use-cases',
    bucket: 'use-case',
    suite: 'kpx',
    maturity: 'beta',
  },
  {
    id: 'usecase-creator-provenance',
    title: 'Creator provenance for releases',
    subtitle: 'Ship hashes, not files, on L1',
    description: 'Use content commits to point to IPFS, Arweave, or mirrors while keeping an immutable Kaspa audit trail.',
    href: '/protocols/kpx#use-cases',
    bucket: 'use-case',
    suite: 'kpx',
    maturity: 'draft',
  },
  {
    id: 'kb-index',
    title: 'Knowledge Base',
    subtitle: 'Long-form guides & specs',
    description: 'Browse all Kasparex documentation including deep dives on protocols, security, and integrations.',
    href: '/knowledge-base',
    bucket: 'documentation',
    suite: 'kasparex',
    maturity: 'stable',
  },
];

const BUCKET_LABEL: Record<ProtocolHubBucket, string> = {
  protocol: 'Protocol',
  tool: 'Tool',
  'use-case': 'Use case',
  documentation: 'Documentation',
  implementation: 'Implementation',
};

export function protocolHubBucketLabel(bucket: ProtocolHubBucket): string {
  return BUCKET_LABEL[bucket];
}

export function countByBucket(items: ProtocolHubItem[]): Record<ProtocolHubBucket, number> {
  const out: Record<ProtocolHubBucket, number> = {
    protocol: 0,
    tool: 0,
    'use-case': 0,
    documentation: 0,
    implementation: 0,
  };
  for (const it of items) {
    out[it.bucket] += 1;
  }
  return out;
}

export function filterProtocolHubItems(
  items: ProtocolHubItem[],
  opts: {
    search: string;
    buckets: ProtocolHubBucket[] | null;
    suite: 'all' | 'kpx';
  }
): ProtocolHubItem[] {
  const q = opts.search.trim().toLowerCase();
  return items.filter((it) => {
    if (opts.suite === 'kpx' && it.suite !== 'kpx') return false;
    if (opts.buckets && opts.buckets.length > 0 && !opts.buckets.includes(it.bucket)) return false;
    if (!q) return true;
    const hay = `${it.title} ${it.subtitle ?? ''} ${it.description}`.toLowerCase();
    return hay.includes(q);
  });
}

export function parseKindsParam(param: string | null): ProtocolHubBucket[] | null {
  if (!param || !param.trim()) return null;
  const parts = param.split(',').map((s) => s.trim()) as ProtocolHubBucket[];
  const valid: ProtocolHubBucket[] = [];
  const allowed: ProtocolHubBucket[] = ['protocol', 'tool', 'use-case', 'documentation', 'implementation'];
  for (const p of parts) {
    if (allowed.includes(p)) valid.push(p);
  }
  return valid.length ? valid : null;
}

/** Resources listed on `/protocols/kpx` (suite-scoped catalog rows). */
export function protocolHubItemsForFamilySlug(slug: string): ProtocolHubItem[] {
  if (slug === 'kpx') return PROTOCOL_HUB_ITEMS.filter((i) => i.suite === 'kpx');
  return [];
}
