/**
 * Domain Configuration
 *
 * Centralized hostnames for Kasparex subsections. Override with NEXT_PUBLIC_* in Vercel
 * when using staging hosts. Middleware rewrites `/` on each host to the matching app path
 * (see sectionHosts.ts).
 */

export const DOMAINS = {
  hub: process.env.NEXT_PUBLIC_HUB_DOMAIN || 'hub.kasparex.com',

  dapps: process.env.NEXT_PUBLIC_DAPPS_DOMAIN || 'dapps.kasparex.com',
  games: process.env.NEXT_PUBLIC_GAMES_DOMAIN || 'games.kasparex.com',
  vblog: process.env.NEXT_PUBLIC_VBLOG_DOMAIN || 'vblog.kasparex.com',
  store: process.env.NEXT_PUBLIC_STORE_DOMAIN || 'store.kasparex.com',
  nodes: process.env.NEXT_PUBLIC_NODES_DOMAIN || 'nodes.kasparex.com',
  magazines: process.env.NEXT_PUBLIC_MAGAZINES_DOMAIN || 'magazines.kasparex.com',
  nft: process.env.NEXT_PUBLIC_NFT_DOMAIN || 'nft.kasparex.com',
  crowdkas: process.env.NEXT_PUBLIC_CROWDKAS_DOMAIN || 'crowdkas.kasparex.com',
  tokens: process.env.NEXT_PUBLIC_TOKENS_DOMAIN || 'tokens.kasparex.com',
  studio: process.env.NEXT_PUBLIC_STUDIO_DOMAIN || 'studio.kasparex.com',
  defi: process.env.NEXT_PUBLIC_DEFI_DOMAIN || 'defi.kasparex.com',
  tree: process.env.NEXT_PUBLIC_TREE_DOMAIN || 'tree.kasparex.com',
  ads: process.env.NEXT_PUBLIC_ADS_DOMAIN || 'ads.kasparex.com',
  chronicles: process.env.NEXT_PUBLIC_CHRONICLES_DOMAIN || 'chronicles.kasparex.com',
  dao: process.env.NEXT_PUBLIC_DAO_DOMAIN || 'dao.kasparex.com',

  docs: process.env.NEXT_PUBLIC_DOCS_DOMAIN || 'docs.kasparex.com',
  api: process.env.NEXT_PUBLIC_API_DOMAIN || 'api.kasparex.com',

  /** Marketing site (Wix); usually not this Next deployment */
  legacy: process.env.NEXT_PUBLIC_LEGACY_DOMAIN || 'www.kasparex.com',
} as const;

/**
 * Get full URL for a subdomain
 */
export function getSubdomainUrl(subdomain: keyof typeof DOMAINS, path = ''): string {
  const domain = DOMAINS[subdomain];
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  return `${protocol}//${domain}${path}`;
}

/**
 * Check if current domain matches a subdomain
 */
export function isOnSubdomain(subdomain: keyof typeof DOMAINS): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === DOMAINS[subdomain];
}

/**
 * Navigate to a subdomain
 */
export function navigateToSubdomain(subdomain: keyof typeof DOMAINS, path = ''): void {
  if (typeof window !== 'undefined') {
    window.location.href = getSubdomainUrl(subdomain, path);
  }
}

/**
 * Get API base URL (human-facing API area under /api on the api host)
 */
export function getApiUrl(): string {
  return getSubdomainUrl('api', '/api');
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('127.0.0.1')
  );
}

/**
 * Get current subdomain key if hostname matches a configured domain
 */
export function getCurrentSubdomain(): keyof typeof DOMAINS | null {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  for (const [key, domain] of Object.entries(DOMAINS)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      return key as keyof typeof DOMAINS;
    }
  }

  return null;
}
