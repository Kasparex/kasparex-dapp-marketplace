/**
 * IPFS Storage Utilities for Tokens
 * Handles uploading and retrieving token logos and featured images from IPFS
 */

import { getIPFSClient } from '@/lib/ipfs/client';
import { getTokenImageUrl } from './metadata';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';

/**
 * Upload token logo to IPFS
 * Stores in folder structure: tokens/{tokenId}/logo.png
 */
export async function uploadTokenLogo(tokenId: string, file: File | Blob): Promise<string | null> {
  try {
    const client = getIPFSClient();
    
    // Use tokenId in filename to maintain folder structure
    const filename = `tokens/${tokenId}/logo.png`;
    const cid = await client.uploadFile(file, { 
      filename,
      pin: true 
    } as any);
    
    return cid;
  } catch (error) {
    console.error('Failed to upload token logo to IPFS:', error);
    return null;
  }
}

/**
 * Upload token featured image to IPFS
 * Stores in folder structure: tokens/{tokenId}/featured.png
 */
export async function uploadTokenFeaturedImage(tokenId: string, file: File | Blob): Promise<string | null> {
  try {
    const client = getIPFSClient();
    
    const filename = `tokens/${tokenId}/featured.png`;
    const cid = await client.uploadFile(file, { 
      filename,
      pin: true 
    } as any);
    
    return cid;
  } catch (error) {
    console.error('Failed to upload token featured image to IPFS:', error);
    return null;
  }
}

/**
 * Get IPFS path for token logo
 */
export function getTokenLogoPath(tokenId: string, cid?: string): string | null {
  if (!cid) return null;
  
  // If base CID is set, construct full path
  const baseCid = process.env.NEXT_PUBLIC_IPFS_BASE_CID;
  if (baseCid) {
    return getBestGatewayUrl(`${baseCid}/tokens/${tokenId}/logo.png`);
  }
  
  // Otherwise, use direct CID
  return getTokenImageUrl(cid);
}

/**
 * Get IPFS path for token featured image
 */
export function getTokenFeaturedImagePath(tokenId: string, cid?: string): string | null {
  if (!cid) return null;
  
  // If base CID is set, construct full path
  const baseCid = process.env.NEXT_PUBLIC_IPFS_BASE_CID;
  if (baseCid) {
    return getBestGatewayUrl(`${baseCid}/tokens/${tokenId}/featured.png`);
  }
  
  // Otherwise, use direct CID
  return getTokenImageUrl(cid);
}

/**
 * Load token logo from localStorage or IPFS
 */
export function loadTokenLogo(tokenId: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `token_${tokenId}_logoCid`;
    const stored = localStorage.getItem(key);
    if (stored) {
      // Check if it's a URL or CID
      if (stored.startsWith('http://') || stored.startsWith('https://')) {
        return stored;
      }
      // It's a CID, get IPFS URL
      return getTokenImageUrl(stored);
    }
  } catch (err) {
    console.error('Error loading token logo:', err);
  }
  
  return null;
}

/**
 * Load token featured image from localStorage or IPFS
 */
export function loadTokenFeaturedImage(tokenId: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = `token_${tokenId}_featuredImageCid`;
    const stored = localStorage.getItem(key);
    if (stored) {
      // Check if it's a URL or CID
      if (stored.startsWith('http://') || stored.startsWith('https://')) {
        return stored;
      }
      // It's a CID, get IPFS URL
      return getTokenImageUrl(stored);
    }
  } catch (err) {
    console.error('Error loading token featured image:', err);
  }
  
  return null;
}

/**
 * Save token logo CID to localStorage
 */
export function saveTokenLogo(tokenId: string, cidOrUrl: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `token_${tokenId}_logoCid`;
    localStorage.setItem(key, cidOrUrl);
  } catch (err) {
    console.error('Error saving token logo:', err);
  }
}

/**
 * Save token featured image CID to localStorage
 */
export function saveTokenFeaturedImage(tokenId: string, cidOrUrl: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `token_${tokenId}_featuredImageCid`;
    localStorage.setItem(key, cidOrUrl);
  } catch (err) {
    console.error('Error saving token featured image:', err);
  }
}

/**
 * Delete token logo from localStorage
 */
export function deleteTokenLogo(tokenId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `token_${tokenId}_logoCid`;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Error deleting token logo:', err);
  }
}

/**
 * Delete token featured image from localStorage
 */
export function deleteTokenFeaturedImage(tokenId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `token_${tokenId}_featuredImageCid`;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Error deleting token featured image:', err);
  }
}
