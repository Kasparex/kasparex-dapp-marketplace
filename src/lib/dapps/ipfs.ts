/**
 * IPFS Asset Management for dApps
 * Handles IPFS-first strategy with fallbacks
 */

import { getBestGatewayUrl, fetchFile, fetchJSON } from '@/lib/ipfs/gateway';
import { getIPFSClient } from '@/lib/ipfs/client';

export interface IPFSMetadata {
  name?: string;
  description?: string;
  image?: string;
  featuredImage?: string;
  logo?: string;
  [key: string]: unknown;
}

/**
 * Load dApp metadata from IPFS
 * Strategy: IPFS CID → Fleek → Public Gateway → Local Storage → null
 */
export async function loadDAppMetadataFromIPFS(cid: string | null | undefined): Promise<IPFSMetadata | null> {
  if (!cid) return null;

  try {
    // Try fetching from IPFS gateways
    const metadata = await fetchJSON<IPFSMetadata>(cid);
    return metadata;
  } catch (error) {
    console.error('Failed to load metadata from IPFS:', error);
    return null;
  }
}

/**
 * Get image URL from IPFS CID with fallback
 */
export function getIPFSImageUrl(cid: string | null | undefined): string | null {
  if (!cid) return null;
  return getBestGatewayUrl(cid);
}

/**
 * Load dApp image from IPFS with fallback chain
 * Strategy: IPFS → Vercel CDN → Local public folder
 */
export async function loadDAppImageFromIPFS(
  cid: string | null | undefined,
  fallbackUrl?: string
): Promise<string | null> {
  if (!cid && !fallbackUrl) return null;

  // If we have a CID, try IPFS first
  if (cid) {
    try {
      const file = await fetchFile(cid);
      if (file) {
        // Create object URL from blob
        return URL.createObjectURL(file);
      }
    } catch (error) {
      console.warn('IPFS image load failed, trying fallback:', error);
    }
  }

  // Fallback to provided URL or null
  return fallbackUrl || null;
}

/**
 * Upload dApp metadata to IPFS
 */
export async function uploadDAppMetadataToIPFS(metadata: IPFSMetadata): Promise<string | null> {
  try {
    const client = getIPFSClient();
    const cid = await client.uploadJSON(metadata, { pin: true });
    return cid;
  } catch (error) {
    console.error('Failed to upload metadata to IPFS:', error);
    return null;
  }
}

/**
 * Check if a string is an IPFS CID
 */
export function isIPFSCID(value: string): boolean {
  // IPFS CIDs typically start with Qm (v0) or are base58 encoded (v1)
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(value) || 
         /^[a-z0-9]{59}$/.test(value) || // v1 CID
         value.startsWith('ipfs://') ||
         value.includes('/ipfs/');
}

/**
 * Extract CID from IPFS URL
 */
export function extractCIDFromURL(url: string): string | null {
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', '');
  }

  // Handle /ipfs/ path
  const match = url.match(/\/ipfs\/([^/?#]+)/);
  if (match) {
    return match[1];
  }

  // If it's already a CID, return as-is
  if (isIPFSCID(url)) {
    return url;
  }

  return null;
}

/**
 * Upload dApp logo to IPFS
 * Stores in folder structure: dapps/{dappId}/logo.png
 */
export async function uploadDAppLogo(dappId: string, file: File | Blob): Promise<string | null> {
  try {
    const client = getIPFSClient();
    
    // Organize in "dApp Images" folder structure
    const filename = `dApp Images/dapps/${dappId}/logo.png`;
    const cid = await client.uploadFile(file, { 
      filename,
      pin: true 
    } as any);
    
    return cid;
  } catch (error) {
    console.error('Failed to upload dApp logo to IPFS:', error);
    return null;
  }
}

/**
 * Upload dApp featured image to IPFS
 * Stores in folder structure: dapps/{dappId}/featured.png
 */
export async function uploadDAppFeaturedImage(dappId: string, file: File | Blob): Promise<string | null> {
  try {
    const client = getIPFSClient();
    
    // Organize in "dApp Images" folder structure
    const filename = `dApp Images/dapps/${dappId}/featured.png`;
    const cid = await client.uploadFile(file, { 
      filename,
      pin: true 
    } as any);
    
    return cid;
  } catch (error) {
    console.error('Failed to upload dApp featured image to IPFS:', error);
    return null;
  }
}

/**
 * Get IPFS path for dApp logo
 */
export function getDAppLogoPath(dappId: string, cid?: string): string | null {
  if (!cid) return null;
  
  // If base CID is set, construct full path
  const baseCid = process.env.NEXT_PUBLIC_IPFS_BASE_CID;
  if (baseCid) {
    return getBestGatewayUrl(`${baseCid}/dapps/${dappId}/logo.png`);
  }
  
  // Otherwise, use direct CID
  return getIPFSImageUrl(cid);
}

/**
 * Get IPFS path for dApp featured image
 */
export function getDAppFeaturedImagePath(dappId: string, cid?: string): string | null {
  if (!cid) return null;
  
  // If base CID is set, construct full path
  const baseCid = process.env.NEXT_PUBLIC_IPFS_BASE_CID;
  if (baseCid) {
    return getBestGatewayUrl(`${baseCid}/dapps/${dappId}/featured.png`);
  }
  
  // Otherwise, use direct CID
  return getIPFSImageUrl(cid);
}
