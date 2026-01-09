/**
 * NFT Utility Functions
 * Helper functions for NFT operations
 */

/**
 * Validate Kaspa address
 */
export function isValidKaspaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  // Basic validation - Kaspa addresses start with 'kaspa:' and have a specific format
  const kaspaAddressRegex = /^kaspa:[a-z0-9]{61,63}$/i;
  return kaspaAddressRegex.test(address) || /^[a-z0-9]{61,63}$/i.test(address);
}

/**
 * Normalize Kaspa address for comparison
 */
export function normalizeKaspaAddress(address: string): string {
  return address.replace(/^kaspa:/i, '').toLowerCase();
}
