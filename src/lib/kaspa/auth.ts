/**
 * Sign-In with Kaspa (SIWK) Authentication
 * 
 * Implementation using @kluster/kaspa-auth for standardized authentication
 */

import { buildMessage, verifySiwk, verifyMessage } from '@kluster/kaspa-auth';
import type { SiwkFields, VerifyResult } from '@kluster/kaspa-auth';
import type { KaspaWalletProvider } from './types';
import { signKaspaMessage } from './wallet';
import { normalizeKaspaAddress } from './sdk';

/**
 * SIWK authentication message parameters
 */
export interface SIWKAuthParams {
  /** Domain requesting authentication */
  domain: string;
  /** User's Kaspa address */
  address: string;
  /** Statement to display to user */
  statement?: string;
  /** URI of the service */
  uri?: string;
  /** Version of SIWK spec */
  version?: string;
  /** Chain ID (kaspa:mainnet or kaspa:testnet) */
  chainId?: string;
  /** Nonce for replay protection */
  nonce?: string;
  /** Issued at time (ISO 8601) */
  issuedAt?: string;
  /** Expiration time (ISO 8601) */
  expirationTime?: string;
  /** Request ID for tracking */
  requestId?: string;
}

/**
 * SIWK authentication result
 */
export interface SIWKAuthResult {
  /** Original address */
  address: string;
  /** Auth message that was signed */
  message: string;
  /** Signature from wallet */
  signature: string;
  /** Provider used */
  provider: KaspaWalletProvider;
  /** Expiration time */
  expirationTime: string;
  /** Nonce used */
  nonce: string;
}

/**
 * Create a SIWK authentication message
 * 
 * @param params - Authentication parameters
 * @returns Formatted authentication message
 */
export function createSIWKMessage(params: SIWKAuthParams): string {
  try {
    const {
      domain,
      address,
      statement = 'Sign in to Kasparex dApps',
      uri,
      version = '1',
      chainId = 'kaspa:mainnet',
      nonce = crypto.randomUUID(),
      issuedAt = new Date().toISOString(),
      expirationTime = new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour default
      requestId,
    } = params;

    // Normalize address
    const normalizedAddress = normalizeKaspaAddress(address);

    // Build SIWK fields
    const siwkFields: SiwkFields = {
      domain,
      address: normalizedAddress,
      statement,
      uri: uri || (typeof window !== 'undefined' ? window.location.origin : `https://${domain}`),
      version,
      chainId,
      nonce,
      issuedAt,
      expirationTime,
      ...(requestId && { requestId }),
    };

    // Create auth message using SDK
    const { message } = buildMessage(siwkFields);
    
    return message;
  } catch (error) {
    console.error('Error creating SIWK message:', error);
    throw new Error(`Failed to create auth message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sign in with Kaspa wallet using SIWK
 * 
 * @param provider - Wallet provider to use
 * @param params - Authentication parameters
 * @returns Authentication result with signature
 */
export async function signInWithKaspa(
  provider: KaspaWalletProvider,
  params: Omit<SIWKAuthParams, 'address'> & { address: string }
): Promise<SIWKAuthResult> {
  try {
    // Normalize address
    const normalizedAddress = normalizeKaspaAddress(params.address);

    // Create SIWK message with full parameters
    const issuedAt = new Date().toISOString();
    const expirationTime = params.expirationTime || new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const nonce = params.nonce || crypto.randomUUID();
    
    const message = createSIWKMessage({
      ...params,
      address: normalizedAddress,
      issuedAt,
      expirationTime,
      nonce,
      uri: params.uri || (typeof window !== 'undefined' ? window.location.origin : `https://${params.domain}`),
    });

    // Sign message with wallet
    const signature = await signKaspaMessage(provider, message);

    return {
      address: normalizedAddress,
      message,
      signature,
      provider,
      expirationTime,
      nonce,
    };
  } catch (error) {
    console.error('Error signing in with Kaspa:', error);
    throw new Error(`Failed to sign in: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify SIWK authentication signature
 * 
 * @param authResult - Authentication result to verify
 * @returns True if signature is valid
 */
export async function verifySIWKSignature(authResult: SIWKAuthResult): Promise<boolean> {
  try {
    // Use verifyMessage for simple message + signature verification
    await verifyMessage(authResult.message, authResult.address, authResult.signature);
    return true;
  } catch (error) {
    console.error('Error verifying SIWK signature:', error);
    return false;
  }
}

/**
 * Check if SIWK authentication is expired
 * 
 * @param expirationTime - Expiration time (ISO 8601)
 * @returns True if expired
 */
export function isSIWKExpired(expirationTime: string): boolean {
  try {
    const expiration = new Date(expirationTime);
    return expiration < new Date();
  } catch (error) {
    console.error('Error checking expiration:', error);
    return true; // Assume expired if we can't parse
  }
}

/**
 * Create a simple SIWK message for backward compatibility
 * This maintains the old message format while using SIWK structure
 * 
 * @param domain - Domain requesting authentication
 * @param address - User's Kaspa address
 * @param appName - Application name
 * @returns Formatted message
 */
export function createSimpleSIWKMessage(
  domain: string,
  address: string,
  appName: string = 'Kasparex dApps'
): string {
  return createSIWKMessage({
    domain,
    address,
    statement: `Welcome to ${appName}!`,
  });
}

