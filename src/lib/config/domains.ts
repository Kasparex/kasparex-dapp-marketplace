/**
 * Domain Configuration
 * 
 * Centralized domain configuration for all Kasparex subdomains
 * Update these when deploying to production
 */

export const DOMAINS = {
  // Main Hub
  hub: process.env.NEXT_PUBLIC_HUB_DOMAIN || 'hub.kasparex.com',
  
  // Sections
  dapps: process.env.NEXT_PUBLIC_DAPPS_DOMAIN || 'dapps.kasparex.com',
  tokens: process.env.NEXT_PUBLIC_TOKENS_DOMAIN || 'tokens.kasparex.com',
  nodes: process.env.NEXT_PUBLIC_NODES_DOMAIN || 'nodes.kasparex.com',
  docs: process.env.NEXT_PUBLIC_DOCS_DOMAIN || 'docs.kasparex.com',
  
  // API
  api: process.env.NEXT_PUBLIC_API_DOMAIN || 'api.kasparex.com',
  
  // Legacy (Wix)
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
 * Get API base URL
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
  return window.location.hostname === 'localhost' || 
         window.location.hostname.includes('localhost') ||
         window.location.hostname.includes('127.0.0.1');
}

/**
 * Get current subdomain
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





















