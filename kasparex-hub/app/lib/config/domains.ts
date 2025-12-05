/**
 * Subdomain Configuration for Kasparex Hub
 * 
 * Defines all subdomains and provides utilities for subdomain detection and navigation
 */

export const DOMAINS = {
  hub: 'hub.kasparex.com',
  dapps: 'dapps.kasparex.com',
  tokens: 'tokens.kasparex.com',
  api: 'api.kasparex.com',
  nodes: 'nodes.kasparex.com',
  docs: 'docs.kasparex.com',
} as const;

/**
 * Get subdomain URL
 */
export function getSubdomainUrl(subdomain: keyof typeof DOMAINS, path = ''): string {
  const baseUrl = `https://${DOMAINS[subdomain]}`;
  return path ? `${baseUrl}${path}` : baseUrl;
}

/**
 * Check if currently on a specific subdomain
 */
export function isOnSubdomain(subdomain: keyof typeof DOMAINS): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === DOMAINS[subdomain];
}

/**
 * Navigate to a subdomain
 */
export function navigateToSubdomain(subdomain: keyof typeof DOMAINS, path = ''): void {
  if (typeof window === 'undefined') return;
  window.location.href = getSubdomainUrl(subdomain, path);
}

/**
 * Get API URL based on environment
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.KASPAREX_API_URL || 'https://api.kasparex.com';
  }
  return process.env.KASPAREX_API_URL || 'https://api.kasparex.com';
}

/**
 * Check if in development mode
 */
export function isDevelopment(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Get current subdomain from hostname
 */
export function getCurrentSubdomain(): keyof typeof DOMAINS | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  for (const [key, domain] of Object.entries(DOMAINS)) {
    if (hostname === domain || hostname.endsWith(`.${domain.split('.')[0]}.${domain.split('.').slice(1).join('.')}`)) {
      return key as keyof typeof DOMAINS;
    }
  }
  
  return null;
}



