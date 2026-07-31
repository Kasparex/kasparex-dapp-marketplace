/**
 * Unified covenant reads: KaspaCom indexer → kascov → kcc20.info (mainnet).
 * Token metadata prefers kcc20.info via kcc20Lookup; this path keeps live KAS/value fields.
 * Client-side only; short in-memory cache per session.
 */

import type { ProgrammableNetworkId } from './config';
import {
  fetchKaspaComCovenantById,
  fetchKaspaComCovenantIdFromTx,
} from './kaspaComIndexerClient';
import {
  fetchKcc20InfoCovenant,
  fetchKcc20InfoCovenantIdFromTx,
  type Kcc20InfoCovenant,
} from './kcc20InfoClient';
import {
  extractKascovTemplateLabel,
  fetchKascovCovenant,
  fetchKascovTxCovenant,
} from './kascovClient';
import type {
  CovenantReadDetail,
  CovenantReadSource,
  KaspaComCovenantDetail,
  KascovCovenantDetail,
} from './types';

/** Aggressive in-session cache for covenant / token metadata lookups. */
const CACHE_TTL_MS = 60 * 60 * 1000;
const covenantCache = new Map<string, { at: number; detail: CovenantReadDetail }>();

function cacheKey(network: ProgrammableNetworkId, covenantId: string): string {
  return `${network}:${covenantId}`;
}

function readCache(network: ProgrammableNetworkId, covenantId: string): CovenantReadDetail | null {
  const row = covenantCache.get(cacheKey(network, covenantId));
  if (!row) return null;
  if (Date.now() - row.at > CACHE_TTL_MS) {
    covenantCache.delete(cacheKey(network, covenantId));
    return null;
  }
  return row.detail;
}

function writeCache(network: ProgrammableNetworkId, detail: CovenantReadDetail): void {
  covenantCache.set(cacheKey(network, detail.covenant_id), { at: Date.now(), detail });
}

function parseSompi(value: number | string | null | undefined): number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
}

function mapKcc20InfoCovenant(detail: Kcc20InfoCovenant): CovenantReadDetail {
  const events = detail.events ?? [];
  const genesis = events.find((e) => e.kind === 'genesis');
  return {
    source: 'kcc20Info',
    covenant_id: detail.covenant_id,
    status: detail.active === false ? 'burned' : 'active',
    event_count: events.length,
    genesis_txid: genesis?.tx_id ?? events[0]?.tx_id ?? null,
  };
}

function mapKaspaComDetail(detail: KaspaComCovenantDetail): CovenantReadDetail | null {
  const summary = detail.covenant;
  if (!summary) return null;
  const covenantId = summary.covenantIdHex?.trim().toLowerCase();
  if (!covenantId || !/^[a-f0-9]{64}$/.test(covenantId)) return null;

  const activeUtxos = summary.activeUtxos ?? 0;
  const liveValue = parseSompi(summary.totalAmountSompi);

  return {
    source: 'kaspaCom',
    covenant_id: covenantId,
    status: activeUtxos > 0 ? 'active' : 'burned',
    live_value: liveValue,
    live_utxos: activeUtxos,
    event_count: detail.actions?.length ?? 0,
    genesis_txid: summary.genesisTxidHex ?? null,
    born_value: liveValue,
    template: summary.template?.trim() || undefined,
    address: summary.address ?? null,
    decodedArgs: summary.decodedArgs ?? null,
  };
}

function mapKascovDetail(detail: KascovCovenantDetail): CovenantReadDetail {
  return {
    source: 'kascov',
    covenant_id: detail.covenant_id,
    status: detail.status,
    live_value: detail.live_value,
    live_utxos: detail.live_utxos,
    event_count: detail.event_count,
    genesis_txid: detail.genesis_txid ?? null,
    born_value: detail.born_value,
    template: extractKascovTemplateLabel(detail),
  };
}

export function extractCovenantTemplateLabel(detail: CovenantReadDetail): string | undefined {
  if (detail.template?.trim()) return detail.template.trim();
  return undefined;
}

export async function resolveCovenantDetail(
  covenantId: string,
  network: ProgrammableNetworkId,
  options?: { skipCache?: boolean },
): Promise<CovenantReadDetail | null> {
  const id = covenantId.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;

  if (!options?.skipCache) {
    const cached = readCache(network, id);
    if (cached) return cached;
  }

  const fromKaspaCom = await fetchKaspaComCovenantById(id, network);
  const mappedKaspaCom = fromKaspaCom ? mapKaspaComDetail(fromKaspaCom) : null;
  if (mappedKaspaCom) {
    writeCache(network, mappedKaspaCom);
    return mappedKaspaCom;
  }

  const fromKascov = await fetchKascovCovenant(id, network);
  if (fromKascov?.covenant_id) {
    const mappedKascov = mapKascovDetail(fromKascov);
    writeCache(network, mappedKascov);
    return mappedKascov;
  }

  const fromKcc20Info = await fetchKcc20InfoCovenant(id, network);
  if (fromKcc20Info) {
    const mapped = mapKcc20InfoCovenant(fromKcc20Info);
    writeCache(network, mapped);
    return mapped;
  }

  return null;
}

export async function resolveCovenantIdFromTx(
  txid: string,
  network: ProgrammableNetworkId,
): Promise<{ covenantId: string; source: CovenantReadSource } | null> {
  const id = txid.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;

  const fromKcc20Info = await fetchKcc20InfoCovenantIdFromTx(id, network);
  if (fromKcc20Info) return { covenantId: fromKcc20Info, source: 'kcc20Info' };

  const fromKaspaCom = await fetchKaspaComCovenantIdFromTx(id, network);
  if (fromKaspaCom) return { covenantId: fromKaspaCom, source: 'kaspaCom' };

  const fromKascov = await fetchKascovTxCovenant(id, network);
  if (fromKascov) return { covenantId: fromKascov, source: 'kascov' };

  return null;
}

/** Live covenant value in sompi as a decimal string, when available. */
export function covenantLiveValueSompi(detail: CovenantReadDetail): string | undefined {
  if (detail.live_value == null || !Number.isFinite(detail.live_value)) return undefined;
  return String(Math.max(0, Math.floor(detail.live_value)));
}
