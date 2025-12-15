/**
 * Kaspa SDK Wrapper
 * 
 * Unified interface for @kluster/kaspa-js SDK packages
 * Provides error handling and backward compatibility
 */

// Address utilities from @kluster/kaspa-address
import { KaspaAddress } from '@kluster/kaspa-address';

/**
 * Validate a Kaspa address using SDK
 * 
 * @param address - Address to validate (with or without kaspa: prefix)
 * @returns True if address is valid
 */
export function isValidKaspaAddress(address: string): boolean {
  try {
    if (!address || typeof address !== 'string') {
      return false;
    }
    
    // Use SDK validation - KaspaAddress.fromString throws if invalid
    KaspaAddress.fromString(address);
    return true;
  } catch (error) {
    // Address is invalid if fromString throws
    return false;
  }
}

/**
 * Encode a public key or address to Kaspa format
 * Note: This function is a placeholder - KaspaAddress.fromString handles parsing
 * 
 * @param input - Address string to normalize
 * @returns Normalized Kaspa address string
 */
export function encodeKaspaAddress(input: string): string {
  try {
    // Validate and return normalized address
    const addr = KaspaAddress.fromString(input);
    return addr.toString();
  } catch (error) {
    console.error('Error encoding Kaspa address:', error);
    throw new Error(`Failed to encode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decode a Kaspa address
 * 
 * @param address - Address to decode (with or without kaspa: prefix)
 * @returns KaspaAddress object with parsed address data
 */
export function decodeKaspaAddress(address: string): KaspaAddress {
  try {
    return KaspaAddress.fromString(address);
  } catch (error) {
    console.error('Error decoding Kaspa address:', error);
    throw new Error(`Failed to decode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize a Kaspa address (ensure kaspa: prefix)
 * 
 * @param address - Address to normalize
 * @returns Normalized address with kaspa: prefix
 */
export function normalizeKaspaAddress(address: string): string {
  if (!address) {
    return '';
  }
  
  // Validate first
  if (!isValidKaspaAddress(address)) {
    throw new Error('Invalid Kaspa address');
  }
  
  // Ensure kaspa: prefix
  return address.startsWith('kaspa:') ? address : `kaspa:${address.replace(/^kaspa:/i, '')}`;
}

/**
 * Format Kaspa address for display
 * 
 * @param address - Address to format
 * @param options - Formatting options
 * @returns Formatted address object
 */
export function formatKaspaAddress(
  address: string,
  options: { startChars?: number; endChars?: number } = {}
): { full: string; short: string; display: string } {
  const { startChars = 6, endChars = 4 } = options;
  
  // Normalize address
  const normalized = normalizeKaspaAddress(address);
  
  // Remove kaspa: prefix for short format
  const short = normalized.replace(/^kaspa:/i, '');
  
  // Create display format
  const display = short.length > startChars + endChars
    ? `${short.substring(0, startChars)}...${short.substring(short.length - endChars)}`
    : short;

  return {
    full: normalized,
    short,
    display,
  };
}

