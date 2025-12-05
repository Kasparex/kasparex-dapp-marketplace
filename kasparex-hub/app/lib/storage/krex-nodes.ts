/**
 * Krex Node Discovery
 * 
 * Fetches available Krex Nodes from Kasparex API for asset resolution
 */

import { getApiUrl } from "~/lib/config/domains";

export interface KrexNode {
  nodeId: string;
  url: string;
  region: string;
  uptime: number;
  pinnedCids: string[];
}

/**
 * Get Krex Node URLs for a specific CID
 */
export async function getKrexNodeUrls(cid: string, region?: string): Promise<string[]> {
  try {
    const apiUrl = getApiUrl();
    const regionParam = region && region !== 'auto' ? `?region=${region}` : '';
    const response = await fetch(
      `${apiUrl}/kasparex/nodes/pinned/${cid}${regionParam}`
    );

    if (!response.ok) {
      console.warn(`Failed to fetch Krex nodes for CID ${cid}`);
      return [];
    }

    const nodes: KrexNode[] = await response.json();
    
    // Sort by: region match → uptime → proximity
    const sortedNodes = nodes.sort((a, b) => {
      if (region && region !== 'auto') {
        if (a.region === region && b.region !== region) return -1;
        if (b.region === region && a.region !== region) return 1;
      }
      return b.uptime - a.uptime;
    });

    return sortedNodes.map(node => `${node.url}/ipfs/${cid}`);
  } catch (error) {
    console.error('Error fetching Krex nodes:', error);
    return [];
  }
}

/**
 * Check if a URL is available
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



