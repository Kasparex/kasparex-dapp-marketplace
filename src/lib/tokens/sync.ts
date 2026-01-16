/**
 * Automatic dApp-Token Logo Sync Utilities
 * Ensures dApp logos automatically match their corresponding token logos
 */

import { loadTokenLogo, saveTokenLogo } from './ipfs';
import { loadDAppLogo } from '@/lib/dapps/contractData';
import { getAllTokens, getTokensByDAppId } from './registry';
import type { Token } from './types';
import type { DApp } from '@/lib/dapps';

/**
 * Sync dApp logo from its corresponding token logo
 * Priority: Use token logo if dApp doesn't have one, or if token logo was just updated
 */
export function syncDAppLogoFromToken(dappId: string, tokenId: string): void {
  if (typeof window === 'undefined') return;

  try {
    // Load token logo
    const tokenLogo = loadTokenLogo(tokenId);
    if (!tokenLogo) return;

    // Check if dApp already has a logo
    const dappLogo = loadDAppLogo(dappId);
    
    // If dApp doesn't have a logo, or if we want to force sync, update it
    if (!dappLogo) {
      // Save token logo as dApp logo
      localStorage.setItem(`dapp_${dappId}_logo`, tokenLogo);
    }
  } catch (err) {
    console.error('Error syncing dApp logo from token:', err);
  }
}

/**
 * Sync all dApp logos from their corresponding tokens
 * Called when tokens are loaded or updated
 */
export function syncAllDAppLogosFromTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    const allTokens = getAllTokens();
    
    // For each token with a parentDAppId, sync the dApp logo
    allTokens.forEach((token) => {
      if (token.parentDAppId) {
        syncDAppLogoFromToken(token.parentDAppId, token.id);
      }
      
      // Also sync for related dApps
      if (token.relatedDAppIds) {
        token.relatedDAppIds.forEach((dappId) => {
          syncDAppLogoFromToken(dappId, token.id);
        });
      }
    });
  } catch (err) {
    console.error('Error syncing all dApp logos:', err);
  }
}

/**
 * Sync dApp logo when token logo is updated
 * Call this after saving a token logo
 */
export function syncDAppLogoOnTokenUpdate(token: Token): void {
  if (typeof window === 'undefined') return;

  try {
    // Sync for parent dApp
    if (token.parentDAppId) {
      syncDAppLogoFromToken(token.parentDAppId, token.id);
    }

    // Sync for related dApps
    if (token.relatedDAppIds) {
      token.relatedDAppIds.forEach((dappId) => {
        syncDAppLogoFromToken(dappId, token.id);
      });
    }
  } catch (err) {
    console.error('Error syncing dApp logo on token update:', err);
  }
}

/**
 * Get token for a dApp (if exists)
 */
export function getTokenForDApp(dappId: string): Token | undefined {
  const tokens = getTokensByDAppId(dappId);
  // Return the first token (usually there's one primary token per dApp)
  return tokens[0];
}

/**
 * Check if dApp should use token logo (automatic sync enabled)
 */
export function shouldSyncDAppLogoFromToken(dappId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const token = getTokenForDApp(dappId);
    if (!token) return false;

    // Check if token has a logo
    const tokenLogo = loadTokenLogo(token.id);
    if (!tokenLogo) return false;

    // Check if dApp already has a logo
    const dappLogo = loadDAppLogo(dappId);
    
    // Auto-sync if dApp doesn't have a logo
    return !dappLogo;
  } catch (err) {
    console.error('Error checking if should sync dApp logo:', err);
    return false;
  }
}
