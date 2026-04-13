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
  /** Canonical shared pages live on hub.* */
  { prefix: '/rewards-and-points', key: 'hub' },
  { prefix: '/rewards', key: 'hub' },
  { prefix: '/points', key: 'hub' },
  { prefix: '/tiers', key: 'hub' },
  { prefix: '/leaderboard', key: 'hub' },
  { prefix: '/stats', key: 'hub' },
  { prefix: '/rewards-calculator', key: 'hub' },
  { prefix: '/style-guide', key: 'dapps' },
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

/** Router "/" is dApps marketplace content; canonical URL for that "home" is hub.* */
function ecosystemHomeUrl(pathnameWithSearch: string): string {
  const q = pathnameWithSearch.indexOf('?');
  const search = q >= 0 ? pathnameWithSearch.slice(q) : '';
  return `https://${DOMAINS.hub}/${search}`;
}

export function buildAbsoluteSectionUrl(sectionKey: SectionDomainKey, pathname: string): string {
  const norm = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normPathOnly = norm.split('?')[0] ?? '/';
  const stripped = normPathOnly.replace(/\/$/, '') || '/';

  if (sectionKey === 'dapps' && (stripped === '/' || stripped === '')) {
    return ecosystemHomeUrl(pathname.includes('?') ? pathname : '/');
  }

  const domain = DOMAINS[sectionKey];
  const root = SUBDOMAIN_ROOT_PATH[sectionKey];

  if (root === '/' && (normPathOnly === '/' || normPathOnly === '')) {
    return `https://${domain}/`;
  }
  if (root && normPathOnly === root) {
    return `https://${domain}/`;
  }
  return `https://${domain}${norm}`;
}

/**
 * Link href: on *.kasparex.com section hosts, use absolute URL to the correct subdomain
 * so navigation does not stay on the wrong host (e.g. api.kasparex.com/vblog).
 */
/** dApps marketplace (router path /) on dapps.* — not the ecosystem hub at hub.* */
export function canonicalDappsMarketplaceHref(currentHost: string | null | undefined): string {
  const raw = currentHost?.split(':')[0];
  if (!raw || !isKasparexSectionHost(raw)) return '/';
  if (hostnameToSectionKey(raw) === 'dapps') return '/';
  return `https://${DOMAINS.dapps}/`;
}

/**
 * Sidebar / quick links: bare "/" means marketplace; "/hub" and other paths get section-aware hosts.
 * Preserves ?query and #hash.
 */
export function resolveSidebarNavHref(href: string, currentHost: string | null | undefined): string {
  if (!href || href.startsWith('http') || href.startsWith('mailto:')) return href;
  if (href.startsWith('#')) return href;

  const hashIdx = href.indexOf('#');
  const beforeHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : '';

  const qIdx = beforeHash.indexOf('?');
  const pathOnly = (qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash) || '/';
  const search = qIdx >= 0 ? beforeHash.slice(qIdx) : '';
  const stripped = pathOnly.replace(/\/$/, '') || '/';

  let resolved: string;
  if (stripped === '/' || stripped === '') {
    resolved = canonicalDappsMarketplaceHref(currentHost);
    if (search) {
      const s = search.startsWith('?') ? search : `?${search}`;
      if (resolved === '/' || resolved === '') {
        resolved = `/${s}`;
      } else {
        resolved = `${resolved.replace(/\/?$/, '')}${s}`;
      }
    }
  } else {
    resolved = canonicalAppHref(beforeHash, currentHost);
  }
  return resolved + hash;
}

export function canonicalAppHref(pathname: string, currentHost: string | null | undefined): string {
  const raw = currentHost?.split(':')[0];
  if (!raw || !isKasparexSectionHost(raw)) {
    return pathname;
  }

  const q = pathname.indexOf('?');
  const pathOnly = (q >= 0 ? pathname.slice(0, q) : pathname) || '/';
  const search = q >= 0 ? pathname.slice(q) : '';
  const p = pathOnly.replace(/\/$/, '') || '/';

  // "/" serves dApps marketplace on dapps.* but canonical ecosystem home is hub.*
  if (p === '/' || p === '') {
    if (hostnameToSectionKey(raw) === 'hub') {
      return search ? `/${search}` : '/';
    }
    return ecosystemHomeUrl(pathname);
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
