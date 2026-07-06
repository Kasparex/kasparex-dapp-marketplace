/**
 * Read-only KaspaCom covenant indexer client (browser-side).
 * See https://indexer.kaspa.com/openapi.json
 */

import { kaspaComIndexerBase, type ProgrammableNetworkId } from './config';
import type { KaspaComActionRow, KaspaComCovenantDetail } from './types';

const FETCH_TIMEOUT_MS = 15_000;

async function fetchKaspaComJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
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

function indexerUrl(network: ProgrammableNetworkId, path: string): string {
  const base = kaspaComIndexerBase(network);
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

export async function fetchKaspaComCovenantById(
  covenantId: string,
  network: ProgrammableNetworkId,
): Promise<KaspaComCovenantDetail | null> {
  const id = covenantId.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  return fetchKaspaComJson<KaspaComCovenantDetail>(indexerUrl(network, `/covenants/by-id/${id}`));
}

export async function fetchKaspaComTxActions(
  txid: string,
  network: ProgrammableNetworkId,
): Promise<KaspaComActionRow[] | null> {
  const id = txid.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const rows = await fetchKaspaComJson<KaspaComActionRow[]>(indexerUrl(network, `/tx/${id}`));
  return Array.isArray(rows) ? rows : null;
}

export async function fetchKaspaComCovenantIdFromTx(
  txid: string,
  network: ProgrammableNetworkId,
): Promise<string | null> {
  const actions = await fetchKaspaComTxActions(txid, network);
  if (!actions?.length) return null;
  for (const row of actions) {
    const covenantId = row.covenantIdHex?.trim().toLowerCase();
    if (covenantId && /^[a-f0-9]{64}$/.test(covenantId)) return covenantId;
  }
  return null;
}

export type KaspaComSettlementStatus = {
  indexed?: boolean;
  [key: string]: unknown;
};

/** Whether a broadcast tx is indexed and decoded yet. */
export async function fetchKaspaComSettlementStatus(
  txid: string,
  network: ProgrammableNetworkId,
): Promise<KaspaComSettlementStatus | null> {
  const id = txid.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  return fetchKaspaComJson<KaspaComSettlementStatus>(
    indexerUrl(network, `/tx/${id}/settlement-status`),
  );
}
