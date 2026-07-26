/**
 * KCC-20 / programmable token lookup.
 * Prefers kcc20.info token projections on mainnet, then KaspaCom / kascov covenant reads.
 */

import { DEFAULT_PROGRAMMABLE_NETWORK, type ProgrammableNetworkId } from '@/lib/programmable/config';
import {
  covenantLiveValueSompi,
  extractCovenantTemplateLabel,
  resolveCovenantDetail,
  resolveCovenantIdFromTx,
} from '@/lib/programmable/covenantRead';
import {
  fetchKcc20InfoToken,
  kcc20InfoImageUrl,
  kcc20InfoResolvedName,
  kcc20InfoResolvedTicker,
  type Kcc20InfoToken,
} from '@/lib/programmable/kcc20InfoClient';
import type { CovenantReadSource } from '@/lib/programmable/types';
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
  readSource?: CovenantReadSource;
  /** Remote logo from kcc20.info genesis metadata when available. */
  imageUrl?: string;
  validationStatus?: string;
};

function covenantIdToTicker(covenantId: string): string {
  return `KCC${covenantId.slice(0, 6).toUpperCase()}`;
}

function holderCount(token: Kcc20InfoToken): number | undefined {
  const n = token.holder_count ?? token.holders;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : undefined;
}

function tokenToSnapshot(
  token: Kcc20InfoToken,
  networkId: ProgrammableNetworkId,
  extras?: {
    status?: string;
    templateLabel?: string;
    liveValueSompi?: string;
    genesisTxid?: string;
    eventCount?: number;
  },
): Kcc20TokenInfo {
  const ticker = kcc20InfoResolvedTicker(token);
  const supply = token.supply?.trim() || token.genesis_supply?.trim() || undefined;
  const minted = token.minted?.trim() || supply;
  return {
    source: 'kcc20',
    ticker,
    name: kcc20InfoResolvedName(token),
    covenantId: token.token_id,
    contractAddress: token.token_id,
    networkId,
    status: extras?.status ?? (token.validation_status === 'verified' ? 'active' : token.validation_status ?? undefined),
    templateLabel: extras?.templateLabel,
    minted,
    maxSupply: supply,
    decimals: 8,
    holderTotal: holderCount(token),
    genesisTxid: extras?.genesisTxid,
    liveValueSompi: extras?.liveValueSompi,
    eventCount: extras?.eventCount ?? (typeof token.action_count === 'number' ? token.action_count : undefined),
    readSource: 'kcc20Info',
    imageUrl: kcc20InfoImageUrl(token),
    validationStatus: token.validation_status ?? undefined,
    fetchedAt: new Date().toISOString(),
  };
}

function detailToSnapshot(
  covenantId: string,
  networkId: ProgrammableNetworkId,
  detail: NonNullable<Awaited<ReturnType<typeof resolveCovenantDetail>>>,
): Kcc20TokenInfo {
  const templateLabel = extractCovenantTemplateLabel(detail);
  const liveSompi = covenantLiveValueSompi(detail);
  return {
    source: 'kcc20',
    ticker: covenantIdToTicker(covenantId),
    name: templateLabel ? `${templateLabel} (${covenantIdToTicker(covenantId)})` : `KCC-20 ${covenantIdToTicker(covenantId)}`,
    covenantId,
    contractAddress: covenantId,
    networkId,
    status: detail.status,
    templateLabel,
    minted: liveSompi,
    maxSupply: liveSompi,
    decimals: 8,
    genesisTxid: detail.genesis_txid ?? undefined,
    liveValueSompi: liveSompi,
    eventCount: detail.event_count,
    readSource: detail.source,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchKcc20ByCovenantId(
  covenantId: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<Kcc20TokenInfo | null> {
  const id = covenantId.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) return null;

  const [token, detail] = await Promise.all([
    fetchKcc20InfoToken(id, network),
    resolveCovenantDetail(id, network),
  ]);

  if (token) {
    return tokenToSnapshot(token, network, {
      status: detail?.status,
      templateLabel: detail ? extractCovenantTemplateLabel(detail) : undefined,
      liveValueSompi: detail ? covenantLiveValueSompi(detail) : undefined,
      genesisTxid: detail?.genesis_txid ?? undefined,
      eventCount: detail?.event_count,
    });
  }

  if (!detail) return null;
  return detailToSnapshot(id, network, detail);
}

export async function fetchKcc20ByTxid(
  txid: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
): Promise<Kcc20TokenInfo | null> {
  const resolved = await resolveCovenantIdFromTx(txid, network);
  if (!resolved) return null;
  return fetchKcc20ByCovenantId(resolved.covenantId, network);
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
