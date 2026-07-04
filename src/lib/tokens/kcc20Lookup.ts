/**
 * KCC-20 / programmable token lookup via kascov (read-only, client-side).
 */

import { DEFAULT_PROGRAMMABLE_NETWORK, type ProgrammableNetworkId } from '@/lib/programmable/config';
import {
  extractKascovTemplateLabel,
  fetchKascovCovenant,
  fetchKascovTxCovenant,
} from '@/lib/programmable/kascovClient';
import type { TokenOnChainSnapshot } from './listingRecord';

export type Kcc20TokenInfo = TokenOnChainSnapshot & {
  source: 'kcc20';
  covenantId: string;
  networkId: ProgrammableNetworkId;
  status?: string;
  templateLabel?: string;
  liveValueSompi?: string;
  genesisTxid?: string;
  eventCount?: number;
};

function sompiToRawString(sompi: number | undefined): string | undefined {
  if (sompi == null || !Number.isFinite(sompi)) return undefined;
  return String(Math.max(0, Math.floor(sompi)));
}

function covenantIdToTicker(covenantId: string): string {
  return `KCC${covenantId.slice(0, 6).toUpperCase()}`;
}

function detailToSnapshot(
  covenantId: string,
  networkId: ProgrammableNetworkId,
  detail: NonNullable<Awaited<ReturnType<typeof fetchKascovCovenant>>>,
): Kcc20TokenInfo {
  const templateLabel = extractKascovTemplateLabel(detail);
  const liveSompi = detail.live_value;
  return {
    source: 'kcc20',
    ticker: covenantIdToTicker(covenantId),
    name: templateLabel ? `${templateLabel} (${covenantIdToTicker(covenantId)})` : `KCC-20 ${covenantIdToTicker(covenantId)}`,
    covenantId,
    contractAddress: covenantId,
    networkId,
    status: detail.status,
    templateLabel,
    minted: sompiToRawString(liveSompi),
    maxSupply: sompiToRawString(detail.born_value ?? liveSompi),
    decimals: 8,
    genesisTxid: detail.genesis_txid ?? undefined,
    liveValueSompi: sompiToRawString(liveSompi),
    eventCount: detail.event_count,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchKcc20ByCovenantId(
  covenantId: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<Kcc20TokenInfo | null> {
  const id = covenantId.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;
  const detail = await fetchKascovCovenant(id, network);
  if (!detail?.covenant_id) return null;
  return detailToSnapshot(id, network, detail);
}

export async function fetchKcc20ByTxid(
  txid: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<Kcc20TokenInfo | null> {
  const covenantId = await fetchKascovTxCovenant(txid, network);
  if (!covenantId) return null;
  return fetchKcc20ByCovenantId(covenantId, network);
}

export async function resolveKcc20ConnectInput(
  input: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<Kcc20TokenInfo | null> {
  const normalized = input.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) return null;
  const byCovenant = await fetchKcc20ByCovenantId(normalized, network);
  if (byCovenant) return byCovenant;
  return fetchKcc20ByTxid(normalized, network);
}

export function formatKcc20Sompi(raw: string | undefined, decimals = 8): string {
  if (!raw) return 'n/a';
  try {
    const n = BigInt(raw);
    const divisor = BigInt(10 ** Math.min(decimals, 18));
    const whole = n / divisor;
    const frac = n % divisor;
    if (frac === BigInt(0)) return whole.toLocaleString();
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole.toLocaleString()}.${fracStr}`;
  } catch {
    return raw;
  }
}
