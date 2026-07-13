/**
 * KRC-20 token lookup via Kasplex indexer (Worker or /api/kasplex-indexer proxy).
 */
import { nodeFirstProxyFetch } from '@/lib/nodes/node-first';
import type { TokenOnChainSnapshot } from './listingRecord';

export type Krc20TokenInfo = TokenOnChainSnapshot & {
  state?: string;
  pre?: string;
  ca?: string;
};

type KasplexTokenResult = {
  tick?: string;
  name?: string;
  ca?: string;
  max?: string;
  minted?: string;
  pre?: string;
  to?: string;
  dec?: string;
  holderTotal?: number;
  state?: string;
};

type KasplexTokenResponse = {
  message?: string;
  result?: KasplexTokenResult[];
};

export async function fetchKrc20TokenInfo(tick: string): Promise<Krc20TokenInfo | null> {
  const normalized = tick.trim().toUpperCase();
  if (!normalized || normalized.length < 4) return null;

  const endpoint = `/v1/krc20/token/${encodeURIComponent(normalized)}`;
  const { response: res } = await nodeFirstProxyFetch('kasplex', endpoint, undefined, { timeoutMs: 4000 });
  if (!res.ok) return null;

  const json = (await res.json()) as KasplexTokenResponse;
  const row = json.result?.[0];
  if (!row?.tick) return null;

  const decimals = row.dec != null ? Number(row.dec) : 8;

  return {
    source: 'krc20',
    ticker: row.tick.toUpperCase(),
    name: row.name?.trim() || row.tick.toUpperCase(),
    maxSupply: row.max,
    minted: row.minted,
    decimals: Number.isFinite(decimals) ? decimals : 8,
    deployer: row.to?.trim(),
    contractAddress: row.ca?.trim(),
    holderTotal: row.holderTotal,
    fetchedAt: new Date().toISOString(),
    state: row.state,
    pre: row.pre,
    ca: row.ca,
  };
}

export function formatKrc20Supply(raw: string | undefined, decimals: number): string {
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
