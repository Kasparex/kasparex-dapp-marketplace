/**
 * Krex Node Discovery
 * 
 * Fetches Krex Node URLs from Cloudflare Workers API
 */

import { api } from '../api/client';

export interface KrexNode {
  node_id: string;
  node_name: string;
  url: string;
  region: string;
  role: 'light' | 'mirror' | 'super';
  uptime: number;
  pinnedCids: string[];
}

export interface KrexNodesResponse {
  nodes: KrexNode[];
}

/**
 * Get Krex Node URLs that have pinned a specific CID
 * 
 * @param cid - IPFS CID
 * @param region - Optional region filter
 * @returns Array of node URLs
 */
export async function getKrexNodeUrls(
  cid: string,
  region?: string
): Promise<string[]> {
  try {
    const endpoint = `/kasparex/nodes/pinned/${cid}${region ? `?region=${region}` : ''}`;
    const response = await api.get<KrexNodesResponse>(endpoint);

    if (!response.nodes || response.nodes.length === 0) {
      return [];
    }

    // Sort by: region match → uptime → proximity
    const sortedNodes = response.nodes
      .filter(node => {
        // Ensure node has the CID pinned
        return Array.isArray(node.pinnedCids) && node.pinnedCids.includes(cid);
      })
      .sort((a, b) => {
        // Prefer nodes in the same region
        if (region) {
          if (a.region === region && b.region !== region) return -1;
          if (b.region === region && a.region !== region) return 1;
        }
        // Sort by uptime (higher is better)
        return b.uptime - a.uptime;
      });

    // Return URLs for accessing the CID
    return sortedNodes.map(node => `${node.url}/ipfs/${cid}`);
  } catch (error) {
    console.warn('Failed to fetch Krex node URLs:', error);
    return [];
  }
}

/**
 * Check if a URL is available (fast HEAD request)
 */
export async function checkAvailability(url: string, timeout = 2000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}


