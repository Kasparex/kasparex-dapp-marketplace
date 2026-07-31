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
  fetchKcc20InfoTokenPage,
  kcc20InfoImageUrl,
  kcc20InfoResolvedName,
  kcc20InfoResolvedTicker,
  type Kcc20InfoToken,
} from '@/lib/programmable/kcc20InfoClient';
import type { CovenantReadSource } from '@/lib/programmable/types';
import { aggressiveCacheGet, aggressiveCacheSet } from '@/lib/hub/aggressiveCache';
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
  /** Raw genesis owner from indexer (`covenant:…` or pubkey hex). */
  genesisOwner?: string;
  genesisOwnerType?: string;
};

function covenantIdToTicker(covenantId: string): string {
  return `KCC${covenantId.slice(0, 6).toUpperCase()}`;
}

function holderCount(token: Kcc20InfoToken): number | undefined {
  const n = token.holder_count ?? token.holders;
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : undefined;
}

/** Prefer a matchable P2PK / pubkey deployer when genesis_owner is a public key. */
function deployerFromGenesisOwner(token: Kcc20InfoToken): string | undefined {
  const owner = token.genesis_owner?.trim();
  if (!owner) return undefined;
  const type = (token.genesis_owner_type ?? '').toLowerCase();
  if (type === 'covenant' || owner.toLowerCase().startsWith('covenant:')) return undefined;
  const hex = owner.replace(/^0x/i, '').toLowerCase();
  if (/^[a-f0-9]{64}$/.test(hex)) return hex;
  if (owner.toLowerCase().startsWith('kaspa:') || owner.toLowerCase().startsWith('kaspatest:')) {
    return owner;
  }
  return undefined;
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
  const deployer = deployerFromGenesisOwner(token);
  return {
    source: 'kcc20',
    ticker,
    name: kcc20InfoResolvedName(token),
    covenantId: token.token_id,
    contractAddress: token.token_id,
    networkId,
    status:
      extras?.status ??
      (token.validation_status === 'verified' ? 'active' : token.validation_status ?? undefined),
    templateLabel: extras?.templateLabel,
    minted,
    maxSupply: supply,
    decimals: 8,
    holderTotal: holderCount(token),
    genesisTxid: extras?.genesisTxid,
    liveValueSompi: extras?.liveValueSompi,
    eventCount:
      extras?.eventCount ?? (typeof token.action_count === 'number' ? token.action_count : undefined),
    readSource: 'kcc20Info',
    imageUrl: kcc20InfoImageUrl(token),
    validationStatus: token.validation_status ?? undefined,
    deployer,
    genesisOwner: token.genesis_owner?.trim() || undefined,
    genesisOwnerType: token.genesis_owner_type?.trim() || undefined,
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
    name: templateLabel
      ? `${templateLabel} (${covenantIdToTicker(covenantId)})`
      : `KCC-20 ${covenantIdToTicker(covenantId)}`,
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

const TOKEN_CATALOG_CACHE_NS = 'kcc20.info.tokens';
const TOKEN_CATALOG_CACHE_KEY = 'mainnet:v1';
const TOKEN_CATALOG_MAX_PAGES = 8;

async function loadKcc20InfoCatalog(network: ProgrammableNetworkId): Promise<Kcc20InfoToken[]> {
  const cached = aggressiveCacheGet<Kcc20InfoToken[]>(TOKEN_CATALOG_CACHE_NS, TOKEN_CATALOG_CACHE_KEY);
  if (cached?.length) return cached;

  const all: Kcc20InfoToken[] = [];
  let afterId: string | undefined;
  for (let page = 0; page < TOKEN_CATALOG_MAX_PAGES; page += 1) {
    const batch = await fetchKcc20InfoTokenPage(network, { afterId, limit: 200 });
    all.push(...batch.tokens);
    if (!batch.nextCursor || batch.tokens.length === 0) break;
    afterId = batch.nextCursor;
  }
  if (all.length > 0) aggressiveCacheSet(TOKEN_CATALOG_CACHE_NS, TOKEN_CATALOG_CACHE_KEY, all);
  return all;
}

/**
 * Search indexed KCC-20 tokens by ticker or name (client-side over kcc20.info catalog).
 * Hex covenant / genesis ids still use resolveKcc20ConnectInput.
 */
export async function searchKcc20ByTickerOrName(
  query: string,
  network: ProgrammableNetworkId = DEFAULT_PROGRAMMABLE_NETWORK,
  limit = 8,
): Promise<Kcc20TokenInfo[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  if (/^[a-f0-9]{64}$/.test(q)) {
    const one = await resolveKcc20ConnectInput(q, network);
    return one ? [one] : [];
  }

  const catalog = await loadKcc20InfoCatalog(network);
  const scored = catalog
    .map((token) => {
      const ticker = (token.ticker ?? '').trim().toLowerCase();
      const name = (token.name ?? token.claimed_name ?? token.fallback_name ?? '').trim().toLowerCase();
      let score = 0;
      if (ticker === q) score = 100;
      else if (ticker.startsWith(q)) score = 80;
      else if (ticker.includes(q)) score = 60;
      else if (name === q) score = 70;
      else if (name.startsWith(q)) score = 50;
      else if (name.includes(q)) score = 30;
      return { token, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || (a.token.ticker ?? '').localeCompare(b.token.ticker ?? ''))
    .slice(0, Math.max(1, limit));

  return scored.map((row) => tokenToSnapshot(row.token, network));
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
