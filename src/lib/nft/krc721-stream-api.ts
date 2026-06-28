/**
 * KRC721 Stream API Integration
 * Fetches NFT ownership data directly from KRC721 protocol API
 *
 * API Documentation: https://mainnet.krc721.stream/docs#http-api
 * Endpoint: GET /api/v1/krc721/{network}/address/{address}
 */

import { resolveCollectionIdFromTick } from './collections';
import { getKrc721IndexerBases } from './indexer-urls';

function getProxyUrl(endpoint: string): string {
  return `/api/krc721-stream?endpoint=${encodeURIComponent(endpoint)}`;
}

export interface KRC721StreamToken {
  tick: string;
  tokenId: string;
  buri?: string;
  baseUri?: string;
  base_uri?: string;
  [key: string]: unknown;
}

export interface KRC721StreamResponse {
  message: string;
  result?: KRC721StreamToken[];
  next?: string;
  [key: string]: unknown;
}

function parseStreamTokens(data: KRC721StreamResponse): KRC721StreamToken[] {
  if (data.message === 'success' && Array.isArray(data.result)) {
    return data.result;
  }
  const alt = (data as Record<string, unknown>).tokens;
  if (Array.isArray(alt)) {
    return alt as KRC721StreamToken[];
  }
  return [];
}

async function fetchStreamPage(endpoint: string): Promise<KRC721StreamResponse> {
  if (typeof window !== 'undefined') {
    const url = getProxyUrl(endpoint);
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        return { message: 'empty', result: [] };
      }
      const errorText = await response.text();
      throw new Error(`KRC721 Stream API error: ${response.status} ${response.statusText} ${errorText}`);
    }

    return (await response.json()) as KRC721StreamResponse;
  }

  const bases = getKrc721IndexerBases();
  let lastError = 'All KRC721 indexers failed';

  for (const base of bases) {
    try {
      const url = `${base}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 400) {
          return { message: 'empty', result: [] };
        }
        lastError = `KRC721 indexer ${base} error: ${response.status} ${response.statusText}`;
        continue;
      }

      return (await response.json()) as KRC721StreamResponse;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown indexer error';
    }
  }

  throw new Error(lastError);
}

/**
 * Fetch all NFTs owned by an address using KRC721 Stream API (with pagination).
 */
export async function fetchNFTsByAddress(address: string): Promise<KRC721StreamToken[]> {
  try {
    const normalizedAddress = address.startsWith('kaspa:') ? address : `kaspa:${address}`;
    const baseEndpoint = `/api/v1/krc721/mainnet/address/${encodeURIComponent(normalizedAddress)}`;

    const allTokens: KRC721StreamToken[] = [];
    let endpoint = baseEndpoint;
    const maxPages = 10;

    for (let page = 0; page < maxPages; page += 1) {
      const data = await fetchStreamPage(endpoint);
      const batch = parseStreamTokens(data);
      if (batch.length > 0) {
        allTokens.push(...batch);
      }

      const next = typeof data.next === 'string' ? data.next.trim() : '';
      if (!next) break;

      endpoint = `${baseEndpoint}?next=${encodeURIComponent(next)}`;
    }

    return allTokens;
  } catch (error) {
    console.error('[KRC721 Stream] Error fetching NFTs:', error);
    return [];
  }
}

/** Resolve metadata base URI from a stream token (handles alternate JSON keys). */
export function streamTokenBaseUri(token: KRC721StreamToken): string | null {
  const t = token as Record<string, unknown>;
  const candidates = [token.buri, token.baseUri, token.base_uri, t.BURI, t.baseURI, t.metadataUri, t.metadata_uri]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((s) => s.trim());
  return candidates[0] ?? null;
}

/** Build IPFS path (CID/subpath) for `{tokenId}.json` under the collection base URI. */
export function streamMetaJsonPathFromBaseUri(baseUri: string, tokenId: number): string | null {
  const s = baseUri.trim();
  if (!s) return null;
  let rest = s;
  if (rest.startsWith('ipfs://')) {
    rest = rest.replace(/^ipfs:\/\//i, '').replace(/\/+$/, '');
  } else if (rest.includes('/ipfs/')) {
    const parts = rest.split('/ipfs/');
    rest = (parts[1] ?? '').replace(/\/+$/, '');
  }
  if (!rest) return null;
  return `${rest}/${tokenId}.json`;
}

/**
 * Filter NFTs by collection tickers (case-insensitive, resolves slug aliases).
 */
export function filterNFTsByCollections(
  tokens: KRC721StreamToken[],
  collectionIds: string[],
): KRC721StreamToken[] {
  const idSet = new Set(collectionIds.map((id) => id.toUpperCase()));
  return tokens.filter((token) => {
    const resolved = resolveCollectionIdFromTick(token.tick);
    return resolved ? idSet.has(resolved) : false;
  });
}
