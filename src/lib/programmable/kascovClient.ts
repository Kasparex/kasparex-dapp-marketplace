/**
 * Read-only kascov JSON client (browser-side, CORS *).
 * Kasparex does not proxy or index covenant data.
 */

import {
  DEFAULT_PROGRAMMABLE_NETWORK,
  kascovDataUrl,
  type ProgrammableNetworkId,
} from './config';
import type { KascovCovenantDetail, KascovTxCovenantLookup } from './types';

async function fetchKascovJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchKascovCovenant(
  covenantId: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<KascovCovenantDetail | null> {
  const id = covenantId.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  return fetchKascovJson<KascovCovenantDetail>(kascovDataUrl(network, `/c/${id}.json`));
}

export async function fetchKascovTxCovenant(
  txid: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<string | null> {
  const id = txid.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const row = await fetchKascovJson<KascovTxCovenantLookup>(kascovDataUrl(network, `/tx/${id}.json`));
  const covenantId = row?.covenant_id?.trim().toLowerCase();
  return covenantId && /^[a-f0-9]{64}$/.test(covenantId) ? covenantId : null;
}

export function extractKascovTemplateLabel(detail: KascovCovenantDetail): string | undefined {
  if (detail.template?.trim()) return detail.template.trim();
  const fromUtxo = detail.utxos?.find((u) => u.template?.trim())?.template?.trim();
  return fromUtxo || undefined;
}
