/**
 * Server-Side Signature Verification
 * 
 * Utilities for verifying Kaspa signatures on the server
 * Uses @kluster/kaspa-signature for verification
 */

import { verifySignature } from '@kluster/kaspa-signature';
import { KaspaAddress } from '@kluster/kaspa-address';
import type { SIWKAuthResult } from './auth';

/**
 * Verify a Kaspa signature
 * 
 * @param message - Original message that was signed
 * @param signature - Signature to verify (hex string)
 * @param address - Address that signed the message
 * @returns True if signature is valid
 */
export async function verifyKaspaSignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  try {
    const kaspaAddress = KaspaAddress.fromString(address);
    return await verifySignature(message, signature, kaspaAddress);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Verify SIWK authentication result
 * 
 * @param authResult - Authentication result to verify
 * @returns True if authentication is valid
 */
export async function verifySIWKAuth(authResult: SIWKAuthResult): Promise<boolean> {
  try {
    // Check expiration first
    const { isSIWKExpired } = await import('./auth');
    if (isSIWKExpired(authResult.expirationTime)) {
      return false;
    }

    // Verify signature
    return await verifyKaspaSignature(
      authResult.message,
      authResult.signature,
      authResult.address
    );
  } catch (error) {
    console.error('Error verifying SIWK auth:', error);
    return false;
  }
}

/**
 * Verify authentication from request headers or body
 * Useful for API routes
 * 
 * @param authData - Authentication data from request
 * @returns Verification result
 */
export async function verifyAuthFromRequest(authData: {
  address: string;
  message: string;
  signature: string;
  expirationTime?: string;
}): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check expiration if provided
    if (authData.expirationTime) {
      const expiration = new Date(authData.expirationTime);
      if (expiration < new Date()) {
        return { valid: false, error: 'Authentication expired' };
      }
    }

    // Verify signature
    const isValid = await verifyKaspaSignature(
      authData.message,
      authData.signature,
      authData.address
    );

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

