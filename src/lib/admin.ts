/**
 * Admin utilities for checking admin status
 * Uses environment variable for frontend checks
 */

/**
 * Hardcoded default admin/deployer address
 * This is the default deployer for all dApps
 */
const DEFAULT_ADMIN_ADDRESS = '0x658420Fd88dbd610249a88384f9B1aD387F797c7'.toLowerCase();

/**
 * Get admin addresses from environment variable
 * Format: comma-separated addresses (e.g., "0x123...,0x456...")
 * Falls back to default admin address if env var is not set
 */
export function getAdminAddresses(): string[] {
  if (typeof window === 'undefined') {
    // Server side
    const envVar = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '';
    const addresses = parseAdminAddresses(envVar);
    // Always include default admin address
    if (addresses.length === 0 || !addresses.includes(DEFAULT_ADMIN_ADDRESS)) {
      return [DEFAULT_ADMIN_ADDRESS, ...addresses.filter(addr => addr !== DEFAULT_ADMIN_ADDRESS)];
    }
    return addresses;
  }
  // Client side
  const envVar = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '';
  const addresses = parseAdminAddresses(envVar);
  // Always include default admin address
  if (addresses.length === 0 || !addresses.includes(DEFAULT_ADMIN_ADDRESS)) {
    return [DEFAULT_ADMIN_ADDRESS, ...addresses.filter(addr => addr !== DEFAULT_ADMIN_ADDRESS)];
  }
  return addresses;
}

/**
 * Parse admin addresses from comma-separated string
 */
function parseAdminAddresses(addressesString: string): string[] {
  if (!addressesString || addressesString.trim() === '') {
    return [];
  }
  
  return addressesString
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => addr.length > 0 && isValidAddress(addr));
}

/**
 * Check if an address is a valid Ethereum address format
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if a wallet address is an admin
 * @param address Wallet address to check (case-insensitive)
 * @returns True if address is in admin list
 */
export function isAdminAddress(address: string | undefined | null): boolean {
  if (!address) {
    return false;
  }
  
  const normalizedAddress = address.toLowerCase();
  const adminAddresses = getAdminAddresses();
  
  return adminAddresses.includes(normalizedAddress);
}

/**
 * Get all admin addresses
 */
export function getAllAdminAddresses(): string[] {
  return getAdminAddresses();
}

