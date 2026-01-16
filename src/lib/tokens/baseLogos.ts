/**
 * Base Token Logos Configuration
 * Logos for KAS, KREX, and GRID tokens that don't have associated dApps
 * These can be stored in public folder initially, then migrated to IPFS
 */

export interface BaseTokenLogo {
  tokenId: string;
  symbol: string;
  logoUrl?: string;
  logoCid?: string;
  featuredImageUrl?: string;
  featuredImageCid?: string;
}

/**
 * Base token logo configurations
 * Update these with actual logo paths/CIDs when provided
 */
export const baseTokenLogos: Record<string, BaseTokenLogo> = {
  kas: {
    tokenId: 'kas',
    symbol: 'KAS',
    logoCid: 'bafkreihdalme24eunumt5hocfagndfrqu6orfxu6r6vv5trgppaxiola7m',
  },
  krex: {
    tokenId: 'krex',
    symbol: 'KREX',
    logoCid: 'bafybeih5exs5c6ustgrryfz76omytnwfl3gw43vbg5pv2rswvjxmt2remq',
  },
  grid: {
    tokenId: 'grid',
    symbol: 'GRID',
    logoCid: 'bafkreifdvxewmxvfcn2ffmkndrudr2f6bqub4m35mzmvsjck4eamkdkpvu',
  },
};

/**
 * Get base token logo configuration
 */
export function getBaseTokenLogo(tokenId: string): BaseTokenLogo | undefined {
  return baseTokenLogos[tokenId.toLowerCase()];
}

/**
 * Get base token logo URL
 * Priority: localStorage > baseLogos config > null
 */
export function getBaseTokenLogoUrl(tokenId: string): string | null {
  if (typeof window === 'undefined') {
    // Server-side: return from config only
    const config = getBaseTokenLogo(tokenId);
    return config?.logoUrl || config?.logoCid || null;
  }

  // Client-side: check localStorage first
  try {
    const key = `token_${tokenId}_logoCid`;
    const stored = localStorage.getItem(key);
    if (stored) {
      // If it's a URL, return as-is
      if (stored.startsWith('http://') || stored.startsWith('https://')) {
        return stored;
      }
      // If it's a CID, we'll resolve it via getTokenImageUrl
      return stored;
    }
  } catch (err) {
    console.error('Error loading base token logo from localStorage:', err);
  }

  // Fallback to config
  const config = getBaseTokenLogo(tokenId);
  return config?.logoUrl || config?.logoCid || null;
}

/**
 * Get base token featured image URL
 */
export function getBaseTokenFeaturedImageUrl(tokenId: string): string | null {
  if (typeof window === 'undefined') {
    const config = getBaseTokenLogo(tokenId);
    return config?.featuredImageUrl || config?.featuredImageCid || null;
  }

  // Client-side: check localStorage first
  try {
    const key = `token_${tokenId}_featuredImageCid`;
    const stored = localStorage.getItem(key);
    if (stored) {
      if (stored.startsWith('http://') || stored.startsWith('https://')) {
        return stored;
      }
      return stored;
    }
  } catch (err) {
    console.error('Error loading base token featured image from localStorage:', err);
  }

  // Fallback to config
  const config = getBaseTokenLogo(tokenId);
  return config?.featuredImageUrl || config?.featuredImageCid || null;
}
