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
  verifiedTxid?: string;
  verifiedAt?: number;
}

export interface KrexNodesResponse {
  /** Worker may return snake_case / mixed shapes; always normalize with mapWorkerNodeRow. */
  nodes?: unknown[];
}

function mapWorkerNodeRow(raw: Record<string, unknown>): KrexNode {
  let pinnedCids: string[] = [];
  if (Array.isArray(raw.pinnedCids)) pinnedCids = raw.pinnedCids as string[];
  else if (typeof raw.pinned_cids === 'string') {
    try {
      pinnedCids = JSON.parse(raw.pinned_cids) as string[];
    } catch {
      pinnedCids = [];
    }
  }
  const uptime = Number(raw.uptime ?? raw.uptime_hours ?? 0) || 0;
  return {
    node_id: String(raw.node_id ?? ''),
    node_name: String(raw.node_name ?? ''),
    url: String(raw.url ?? ''),
    region: String(raw.region ?? ''),
    role: (raw.role as KrexNode['role']) || 'light',
    uptime,
    pinnedCids: Array.isArray(pinnedCids) ? pinnedCids : [],
    verifiedTxid:
      typeof raw.verified_txid === 'string'
        ? raw.verified_txid
        : typeof raw.verifiedTxid === 'string'
          ? raw.verifiedTxid
          : undefined,
    verifiedAt:
      typeof raw.verified_at === 'number'
        ? raw.verified_at
        : typeof raw.verifiedAt === 'number'
          ? raw.verifiedAt
          : undefined,
  };
}

/**
 * Get all currently active nodes (pinged recently) from the registry.
 * This is the base primitive for node-first routing.
 */
export async function getKrexNodes(options?: {
  region?: string;
  role?: KrexNode['role'];
}): Promise<KrexNode[]> {
  try {
    const query = new URLSearchParams();
    if (options?.region) query.set('region', options.region);
    if (options?.role) query.set('role', options.role);
    const endpoint = `/kasparex/nodes${query.size ? `?${query.toString()}` : ''}`;
    const response = await api.get<{ nodes?: Record<string, unknown>[] }>(endpoint);
    const rows = Array.isArray(response.nodes) ? response.nodes : [];
    return rows.map((r) => mapWorkerNodeRow(r));
  } catch (error) {
    console.warn('Failed to fetch Krex nodes:', error);
    return [];
  }
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

    const mapped = (Array.isArray(response.nodes) ? response.nodes : []).map((r) =>
      mapWorkerNodeRow(r as unknown as Record<string, unknown>)
    );

    if (!mapped.length) {
      return [];
    }

    // Sort by: region match → uptime → proximity
    const sortedNodes = mapped
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

/**
 * Quick JSON GET with timeout (used by node-first routing).
 */
export async function fetchJsonWithTimeout<T>(
  url: string,
  options?: { timeoutMs?: number; headers?: Record<string, string> }
): Promise<T> {
  const timeoutMs = Math.max(500, options?.timeoutMs ?? 3500);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(options?.headers ?? {}),
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}


