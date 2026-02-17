/**
 * Referral URL Utilities
 * 
 * Functions for generating and handling referral links
 */

import { RevenueTreeContentType } from './types';

/**
 * Generate a referral link for a content item
 */
export function generateReferralLink(
  contentType: RevenueTreeContentType,
  slug: string,
  walletAddress: string,
  issueNumber?: number
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  let path: string;
  if (contentType === 'magazine') {
    path = `/magazines/${slug}/${issueNumber}`;
  } else {
    // dapp, vblog, game, store
    const pluralMap: Record<RevenueTreeContentType, string> = {
      dapp: 'dapps',
      magazine: 'magazines',
      vblog: 'vblog',
      game: 'games',
      store: 'store',
    };
    path = `/${pluralMap[contentType]}/${slug}`;
  }
  
  return `${baseUrl}${path}?ref=${walletAddress}`;
}

/**
 * Extract referral wallet address from URL
 */
export function getReferralFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}

/**
 * Store referral wallet address in localStorage
 */
export function storeReferral(referrerAddress: string, contentType: RevenueTreeContentType, contentSlug: string): void {
  if (typeof window === 'undefined') return;
  
  const key = `referral:${contentType}:${contentSlug}`;
  localStorage.setItem(key, referrerAddress);
  
  // Also store a global referral for this session
  localStorage.setItem('current_referrer', referrerAddress);
}

/**
 * Get stored referral wallet address
 */
export function getStoredReferral(contentType: RevenueTreeContentType, contentSlug: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const key = `referral:${contentType}:${contentSlug}`;
  return localStorage.getItem(key);
}

/**
 * Clear stored referral
 */
export function clearReferral(contentType: RevenueTreeContentType, contentSlug: string): void {
  if (typeof window === 'undefined') return;
  
  const key = `referral:${contentType}:${contentSlug}`;
  localStorage.removeItem(key);
}
