/**
 * Read-only kcc20.info client (Kaspa Covenant Indexer / KCC20 projections).
 * Browser calls go through /api/kcc20-indexer (upstream has no CORS).
 * Mainnet only; returns null on other networks.
 */

import { kcc20InfoBase, type ProgrammableNetworkId } from './config';

const FETCH_TIMEOUT_MS = 15_000;

export type Kcc20InfoToken = {
  token_id: string;
  name?: string | null;
  claimed_name?: string | null;
  ticker?: string | null;
  image?: string | null;
  image_hash?: string | null;
  metadata_source?: string | null;
  image_api?: string | null;
  fallback_name?: string | null;
  genesis_supply?: string | null;
  action_count?: number | null;
  genesis_daa?: number | null;
  last_daa?: number | null;
  validation_status?: string | null;
  supply?: string | null;
  minted?: string | null;
  burned?: string | null;
  holder_count?: number | null;
  holders?: number | null;
  unresolved_cells?: number | null;
  snapshot_daa?: number | null;
  holders_available?: boolean | null;
  balances_available?: boolean | null;
};

export type Kcc20InfoCovenant = {
  covenant_id: string;
  active?: boolean | null;
  events?: Array<{
    ingest_id?: number;
    event_id?: string;
    sequence?: number;
    kind?: string;
    tx_id?: string;
    accepting_daa?: number;
    accepting_block?: string;
  }>;
};

type EventsResponse = {
  events?: Array<{
    covenant_id?: string;
    tx_id?: string;
    kind?: string;
  }>;
};

function isMainnet(network: ProgrammableNetworkId): boolean {
  return network === 'mainnet';
}

function requestUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') {
    return `${kcc20InfoBase()}${normalized}`;
  }
  return `/api/kcc20-indexer?endpoint=${encodeURIComponent(normalized)}`;
}

async function fetchKcc20InfoJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(requestUrl(path), {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchKcc20InfoToken(
  tokenId: string,
  network: ProgrammableNetworkId,
): Promise<Kcc20InfoToken | null> {
  if (!isMainnet(network)) return null;
  const id = tokenId.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const row = await fetchKcc20InfoJson<Kcc20InfoToken>(`/v1/tokens/${id}`);
  if (!row?.token_id || !/^[a-f0-9]{64}$/i.test(row.token_id)) return null;
  return { ...row, token_id: row.token_id.trim().toLowerCase() };
}

export async function fetchKcc20InfoCovenant(
  covenantId: string,
  network: ProgrammableNetworkId,
): Promise<Kcc20InfoCovenant | null> {
  if (!isMainnet(network)) return null;
  const id = covenantId.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const row = await fetchKcc20InfoJson<Kcc20InfoCovenant>(`/v1/covenants/${id}`);
  if (!row?.covenant_id || !/^[a-f0-9]{64}$/i.test(row.covenant_id)) return null;
  return { ...row, covenant_id: row.covenant_id.trim().toLowerCase() };
}

export async function fetchKcc20InfoCovenantIdFromTx(
  txid: string,
  network: ProgrammableNetworkId,
): Promise<string | null> {
  if (!isMainnet(network)) return null;
  const id = txid.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const data = await fetchKcc20InfoJson<EventsResponse>(`/v1/events?tx_id=${id}&limit=20`);
  const events = data?.events;
  if (!Array.isArray(events)) return null;
  for (const row of events) {
    const covenantId = row.covenant_id?.trim().toLowerCase();
    if (covenantId && /^[a-f0-9]{64}$/.test(covenantId)) return covenantId;
  }
  return null;
}

export function kcc20InfoResolvedTicker(token: Kcc20InfoToken): string {
  const ticker = token.ticker?.trim();
  if (ticker) return ticker.toUpperCase();
  const claimed = token.claimed_name?.trim();
  if (claimed && claimed.length <= 12 && !/\s/.test(claimed)) return claimed.toUpperCase();
  return `KCC${token.token_id.slice(0, 6).toUpperCase()}`;
}

export function kcc20InfoResolvedName(token: Kcc20InfoToken): string {
  const name = token.name?.trim() || token.claimed_name?.trim() || token.fallback_name?.trim();
  if (name) return name;
  return `KCC-20 ${kcc20InfoResolvedTicker(token)}`;
}

export function kcc20InfoImageUrl(token: Kcc20InfoToken): string | undefined {
  const remote = token.image?.trim();
  if (remote) return remote;
  const apiPath = token.image_api?.trim();
  if (!apiPath) return undefined;
  const base = kcc20InfoBase();
  return apiPath.startsWith('http') ? apiPath : `${base}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
}
