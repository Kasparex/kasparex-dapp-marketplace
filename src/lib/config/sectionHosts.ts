/**
 * Kasparex section subdomains: path → hostname mapping, canonical URLs, and middleware helpers.
 * Keep in sync with src/lib/config/domains.ts DOMAINS keys.
 */
import { DOMAINS } from '@/lib/config/domains';

export type SectionDomainKey = Exclude<keyof typeof DOMAINS, 'legacy'>;

/** Path served at `/` for each section host (middleware internal rewrite). */
export const SUBDOMAIN_ROOT_PATH: Partial<Record<SectionDomainKey, string>> = {
  dapps: '/',
  games: '/games',
  vblog: '/vblog',
  store: '/store',
  nodes: '/nodes',
  magazines: '/magazines',
  nft: '/nft',
  crowdkas: '/donations',
  tokens: '/tokens',
  studio: '/studio',
  defi: '/defi/swaps',
  hub: '/hub',
  tree: '/tree',
  ads: '/ads',
  chronicles: '/chronicles',
  dao: '/dapps/dao-voting',
  api: '/api',
  docs: '/knowledge-base',
};

/** Longest-prefix wins. Order matters. */
const PATH_TO_SECTION: { prefix: string; key: SectionDomainKey }[] = [
  { prefix: '/hub/coming-soon', key: 'hub' },
  { prefix: '/defi/swaps', key: 'defi' },
  { prefix: '/defi', key: 'defi' },
  { prefix: '/dapps/dao-voting', key: 'dao' },
  { prefix: '/dapps', key: 'dapps' },
  { prefix: '/games', key: 'games' },
  { prefix: '/vblog', key: 'vblog' },
  { prefix: '/magazines', key: 'magazines' },
  { prefix: '/chronicles', key: 'chronicles' },
  { prefix: '/knowledge-base', key: 'docs' },
  { prefix: '/donations', key: 'crowdkas' },
  { prefix: '/tokens', key: 'tokens' },
  { prefix: '/studio', key: 'studio' },
  { prefix: '/nodes', key: 'nodes' },
  { prefix: '/store', key: 'store' },
  { prefix: '/nft', key: 'nft' },
  { prefix: '/ads', key: 'ads' },
  { prefix: '/tree', key: 'tree' },
  { prefix: '/hub', key: 'hub' },
  /** Shared “main app” routes (mega menu / footer): serve from dApps host in production */
  { prefix: '/rewards-and-points', key: 'dapps' },
  { prefix: '/rewards-calculator', key: 'dapps' },
  { prefix: '/leaderboard', key: 'dapps' },
  { prefix: '/stats', key: 'dapps' },
  { prefix: '/style-guide', key: 'dapps' },
  { prefix: '/tiers', key: 'dapps' },
  { prefix: '/points', key: 'dapps' },
  { prefix: '/rewards', key: 'dapps' },
];

export function isKasparexSectionHost(host: string): boolean {
  const h = host.split(':')[0].toLowerCase();
  return h.endsWith('.kasparex.com') && h !== 'www.kasparex.com';
}

export function hostnameToSectionKey(host: string): SectionDomainKey | null {
  const h = host.split(':')[0].toLowerCase();
  for (const [key, domain] of Object.entries(DOMAINS)) {
    if (key === 'legacy') continue;
    if (typeof domain === 'string' && domain.toLowerCase() === h) {
      return key as SectionDomainKey;
    }
  }
  return null;
}

/**
 * Which section "owns" this pathname for cross-subdomain linking and redirects.
 * Returns null for neutral routes (stay on current host): /updates, /admin, /api/* handlers, etc.
 */
export function pathToSectionKey(pathname: string): SectionDomainKey | null {
  const p = (pathname.split('?')[0] || '/').replace(/\/$/, '') || '/';
  if (p.startsWith('/_next')) return null;
  /** Human API hub and route handlers share /api; canonical host is api.* for navigation. */
  if (p === '/api' || p.startsWith('/api/')) return 'api';
  if (p === '/' || p === '') return 'dapps';

  for (const { prefix, key } of PATH_TO_SECTION) {
    const pre = prefix.replace(/\/$/, '') || prefix;
    if (p === pre || p.startsWith(`${pre}/`)) return key;
  }
  return null;
}

/** Middleware: rewrite `/` on section hosts to internal path. */
export function rewriteRootPathForHost(hostname: string): string | null {
  const h = hostname.toLowerCase();
  const keys = Object.keys(SUBDOMAIN_ROOT_PATH) as SectionDomainKey[];
  for (const key of keys) {
    const path = SUBDOMAIN_ROOT_PATH[key];
    if (path === undefined) continue;
    const domain = DOMAINS[key];
    if (typeof domain === 'string' && domain.toLowerCase() === h) {
      return path;
    }
  }
  return null;
}

export function buildAbsoluteSectionUrl(sectionKey: SectionDomainKey, pathname: string): string {
  const domain = DOMAINS[sectionKey];
  const norm = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const root = SUBDOMAIN_ROOT_PATH[sectionKey];

  if (root === '/' && (norm === '/' || norm === '')) {
    return `https://${domain}/`;
  }
  if (root && norm === root) {
    return `https://${domain}/`;
  }
  return `https://${domain}${norm}`;
}

/**
 * Link href: on *.kasparex.com section hosts, use absolute URL to the correct subdomain
 * so navigation does not stay on the wrong host (e.g. api.kasparex.com/vblog).
 */
export function canonicalAppHref(pathname: string, currentHost: string | null | undefined): string {
  const raw = currentHost?.split(':')[0];
  if (!raw || !isKasparexSectionHost(raw)) {
    return pathname;
  }

  const targetKey = pathToSectionKey(pathname);
  if (!targetKey) return pathname;

  const currentKey = hostnameToSectionKey(raw);
  if (!currentKey) return pathname;
  if (currentKey === targetKey) return pathname;

  return buildAbsoluteSectionUrl(targetKey, pathname);
}

/**
 * Browser pathname is `/` after middleware rewrite; map to logical path for section title / active nav.
 */
export function segmentPathForHost(pathname: string, currentHost: string | null | undefined): string {
  const raw = currentHost?.split(':')[0];
  if (!raw || !isKasparexSectionHost(raw)) return pathname;
  const key = hostnameToSectionKey(raw);
  if (!key) return pathname;
  const root = SUBDOMAIN_ROOT_PATH[key];
  if (pathname === '/' && root && root !== '/') {
    return root;
  }
  return pathname;
}
