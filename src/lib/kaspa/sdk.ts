/**
 * Kaspa SDK Wrapper
 *
 * Unified interface for @kluster/kaspa-js SDK packages
 * Provides error handling and backward compatibility
 */

// Address utilities from @kluster/kaspa-address
import { KaspaAddress } from '@kluster/kaspa-address';

export type KaspaAddressHrp = 'kaspa' | 'kaspatest';

const TESTNET_HRP_PREFIX = 'kaspatest:';
const MAINNET_HRP_PREFIX = 'kaspa:';

/** Split a prefixed Kaspa or kaspatest address. Returns null when no known HRP is present. */
export function parseKaspaAddressParts(address: string): { hrp: KaspaAddressHrp; body: string } | null {
  const trimmed = address.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith(TESTNET_HRP_PREFIX)) {
    return { hrp: 'kaspatest', body: trimmed.slice(TESTNET_HRP_PREFIX.length) };
  }
  if (lower.startsWith(MAINNET_HRP_PREFIX)) {
    return { hrp: 'kaspa', body: trimmed.slice(MAINNET_HRP_PREFIX.length) };
  }
  return null;
}

/** Payload without kaspa: or kaspatest: prefix (testnet checked first). */
export function stripKaspaAddressHrp(address: string): string {
  const parts = parseKaspaAddressParts(address);
  if (parts) return parts.body;
  return address.trim();
}

export function isKaspaTestnetAddress(address: string): boolean {
  const parts = parseKaspaAddressParts(address);
  return parts?.hrp === 'kaspatest' && isValidTestnetAddressBody(parts.body);
}

function isValidTestnetAddressBody(body: string): boolean {
  return /^[a-z0-9]{50,120}$/i.test(body);
}

function toPrefixedAddress(hrp: KaspaAddressHrp, body: string): string {
  return `${hrp}:${body}`;
}

/**
 * Validate a Kaspa address using SDK (mainnet) or prefix/body rules (testnet-10).
 */
export function isValidKaspaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  const parts = parseKaspaAddressParts(address);
  if (!parts?.body) {
    return false;
  }

  if (parts.hrp === 'kaspatest') {
    return isValidTestnetAddressBody(parts.body);
  }

  try {
    KaspaAddress.fromString(toPrefixedAddress('kaspa', parts.body));
    return true;
  } catch {
    return false;
  }
}

/**
 * Encode a public key or address to Kaspa format
 */
export function encodeKaspaAddress(input: string): string {
  try {
    if (isKaspaTestnetAddress(input)) {
      const parts = parseKaspaAddressParts(input);
      if (!parts) throw new Error('Invalid testnet address');
      return toPrefixedAddress('kaspatest', parts.body);
    }
    const addr = KaspaAddress.fromString(input);
    return addr.toString();
  } catch (error) {
    console.error('Error encoding Kaspa address:', error);
    throw new Error(`Failed to encode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decode a Kaspa address (mainnet SDK path; testnet returns normalized string shape only).
 */
export function decodeKaspaAddress(address: string): KaspaAddress {
  try {
    if (isKaspaTestnetAddress(address)) {
      throw new Error('Testnet addresses are not decodable via mainnet KaspaAddress SDK');
    }
    return KaspaAddress.fromString(address);
  } catch (error) {
    console.error('Error decoding Kaspa address:', error);
    throw new Error(`Failed to decode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize a Kaspa address (kaspa: or kaspatest: prefix).
 */
export function normalizeKaspaAddress(address: string): string {
  if (!address) {
    return '';
  }

  const trimmed = address.trim();
  const parts = parseKaspaAddressParts(trimmed);
  const candidate = parts
    ? toPrefixedAddress(parts.hrp, parts.body)
    : toPrefixedAddress('kaspa', trimmed.replace(/^kaspa:/i, '').replace(/^kaspatest:/i, ''));

  if (!isValidKaspaAddress(candidate)) {
    throw new Error('Invalid Kaspa address');
  }

  return candidate;
}

/**
 * Format Kaspa address for display
 */
export function formatKaspaAddress(
  address: string,
  options: { startChars?: number; endChars?: number } = {},
): { full: string; short: string; display: string } {
  const { startChars = 6, endChars = 4 } = options;

  const normalized = normalizeKaspaAddress(address);
  const short = stripKaspaAddressHrp(normalized);

  const display =
    short.length > startChars + endChars
      ? `${short.substring(0, startChars)}...${short.substring(short.length - endChars)}`
      : short;

  return {
    full: normalized,
    short,
    display,
  };
}
