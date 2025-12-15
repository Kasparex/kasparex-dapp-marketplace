/**
 * Kaspa SDK Wrapper
 * 
 * Unified interface for @kluster/kaspa-js SDK packages
 * Provides error handling and backward compatibility
 */

// Address utilities from @kluster/kaspa-address
import { 
  isValidAddress as sdkIsValidAddress,
  encodeAddress as sdkEncodeAddress,
  decodeAddress as sdkDecodeAddress,
} from '@kluster/kaspa-address';

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
    
    // Remove kaspa: prefix for validation
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    
    // Use SDK validation
    return sdkIsValidAddress(addressWithoutPrefix);
  } catch (error) {
    console.error('Error validating Kaspa address:', error);
    return false;
  }
}

/**
 * Encode a public key or address to Kaspa format
 * 
 * @param input - Public key or address to encode
 * @returns Encoded Kaspa address
 */
export function encodeKaspaAddress(input: string | Uint8Array): string {
  try {
    return sdkEncodeAddress(input);
  } catch (error) {
    console.error('Error encoding Kaspa address:', error);
    throw new Error(`Failed to encode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decode a Kaspa address
 * 
 * @param address - Address to decode (with or without kaspa: prefix)
 * @returns Decoded address data
 */
export function decodeKaspaAddress(address: string) {
  try {
    // Remove kaspa: prefix for decoding
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    return sdkDecodeAddress(addressWithoutPrefix);
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

