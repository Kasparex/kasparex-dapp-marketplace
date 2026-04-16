/**
 * Maps production hostnames (NEXT_PUBLIC_*_DOMAIN or *.kasparex.com defaults) to the
 * in-app path served at URL `/` for that host. Used by src/middleware.ts.
 */
import { DOMAINS } from '@/lib/config/domains';

type DomainKey = keyof typeof DOMAINS;

/** Path to internally rewrite `/` to when Host matches DOMAINS[key]. Omit `legacy` (Wix). */
const SUBDOMAIN_ROOT_PATH: Partial<Record<DomainKey, string>> = {
  dapps: '/',
  games: '/games',
  vblog: '/vblog',
  store: '/store',
  nodes: '/nodes',
  magazines: '/magazines',
  nft: '/nft',
  crowdkas: '/donations',
  tokens: '/tokens',
  studio: '/u',
  defi: '/defi/swaps',
  hub: '/hub',
  tree: '/tree',
  ads: '/ads',
  chronicles: '/chronicles',
  dao: '/dapps/dao-voting',
  api: '/api',
  docs: '/knowledge-base',
};

/**
 * If this hostname is a configured Kasparex section domain, return the pathname to rewrite `/` to.
 */
export function rewriteRootPathForHost(hostname: string): string | null {
  const h = hostname.toLowerCase();
  for (const key of Object.keys(SUBDOMAIN_ROOT_PATH) as DomainKey[]) {
    const path = SUBDOMAIN_ROOT_PATH[key];
    if (path === undefined) continue;
    const domain = DOMAINS[key];
    if (typeof domain === 'string' && domain.toLowerCase() === h) {
      return path;
    }
  }
  return null;
}
