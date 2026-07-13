/**
 * Try fetching IPFS content from operator nodes that pin the CID, then fall back.
 */

import { getKrexNodeUrls } from '@/lib/storage/krex-nodes';
import { isNodeReachableFromBrowser } from '@/lib/nodes/node-first';

function cleanCid(hash: string): string {
  return hash.replace(/^\/?ipfs\//, '').replace(/^ipfs:\/\//, '').split('/')[0] ?? '';
}

export function nodeFirstIpfsReadsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return process.env.NEXT_PUBLIC_NODE_FIRST_READS !== 'false';
}

/**
 * GET from `/ipfs/{cid}` on edge/light nodes that report the CID pinned.
 */
export async function fetchFromPinnedNodes(
  hash: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response | null> {
  if (!nodeFirstIpfsReadsEnabled()) return null;
  const cid = cleanCid(hash);
  if (!cid || cid.length < 32) return null;

  const timeoutMs = Math.max(800, init?.timeoutMs ?? 2500);
  let urls: string[] = [];
  try {
    urls = await getKrexNodeUrls(cid);
  } catch {
    return null;
  }

  for (const url of urls.slice(0, 3)) {
    if (!isNodeReachableFromBrowser(url.replace(/\/ipfs\/.*$/, ''))) continue;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        ...init,
        method: init?.method ?? 'GET',
        signal: init?.signal ?? controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) return response;
    } catch {
      // try next node
    }
  }
  return null;
}
