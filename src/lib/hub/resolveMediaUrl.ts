import { extractCidFromIpfsUrl, getBestGatewayUrl, normalizeIpfsUrlForForm } from '@/lib/ipfs/gateway';

/**
 * Resolve a hub media URL for display (cards, heroes, listings).
 * Handles raw CIDs, ipfs:// URIs, proxy paths, and cross-origin proxy URLs.
 */
export function resolveHubMediaUrl(
  url?: string | null,
  cid?: string | null,
): string {
  const normalized = normalizeIpfsUrlForForm(url, cid);
  if (normalized) return normalized;

  const trimmed = url?.trim();
  if (!trimmed) {
    const cleanCid = cid?.trim();
    return cleanCid ? getBestGatewayUrl(cleanCid) : '';
  }

  const extracted = extractCidFromIpfsUrl(trimmed);
  if (extracted) return getBestGatewayUrl(extracted);

  if (trimmed.startsWith('Qm') || trimmed.startsWith('baf')) {
    return getBestGatewayUrl(trimmed);
  }

  return trimmed;
}
