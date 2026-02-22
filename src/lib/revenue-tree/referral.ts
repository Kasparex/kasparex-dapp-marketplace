/**
 * Referral URL Utilities
 * 
 * Functions for generating and handling referral links
 */

import { RevenueTreeContentType } from './types';

/**
 * Universal Revenue Tree referral link: /ref/<walletAddress>.
 * Use this as the single "Revenue Tree" referral link (one per wallet per chain).
 */
export function getUniversalReferralLink(walletAddress: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/ref/${walletAddress}`;
}

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
      donation: 'donations',
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

/** Key for global "current referrer" (set by /ref/[address] or any ref landing). */
export const CURRENT_REFERRER_KEY = 'current_referrer';

/**
 * Get the current referrer for this visit: URL param ?ref= first, then localStorage current_referrer.
 * Use when prompting one-time "Set referrer" on-chain.
 */
export function getCurrentReferrer(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('ref');
  if (fromUrl) return fromUrl;
  return localStorage.getItem(CURRENT_REFERRER_KEY);
}

/**
 * Store the current referrer globally (e.g. when landing on /ref/[address]).
 * When user connects wallet, frontend can prompt setReferrer(referrer) once.
 */
export function setCurrentReferrer(referrerAddress: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_REFERRER_KEY, referrerAddress);
}

/**
 * Clear stored referral
 */
export function clearReferral(contentType: RevenueTreeContentType, contentSlug: string): void {
  if (typeof window === 'undefined') return;
  
  const key = `referral:${contentType}:${contentSlug}`;
  localStorage.removeItem(key);
}
