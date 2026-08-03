/**
 * Direct Kasplex fetch for KCC20 Bridge network selection (mainnet vs TN10).
 * Browser CORS: tn10api and api.kasplex.org allow public GET; fall back carefully.
 */
import type { Krc20TokenInfo } from '@/lib/tokens/krc20Lookup';
import { kasplexApiBaseForNetwork } from './config';
import type { Krc20BridgeNetwork } from './types';

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

async function kasplexGet(network: Krc20BridgeNetwork, endpoint: string): Promise<Response> {
  const base = kasplexApiBaseForNetwork(network);
  return fetch(`${base}${endpoint}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
}

export async function fetchKrc20TokenInfoOnNetwork(
  tick: string,
  network: Krc20BridgeNetwork,
): Promise<Krc20TokenInfo | null> {
  const normalized = tick.trim().toUpperCase();
  if (!normalized || normalized.length < 4) return null;
  try {
    const res = await kasplexGet(network, `/v1/krc20/token/${encodeURIComponent(normalized)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: KasplexTokenResult[] };
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
  } catch {
    return null;
  }
}

export async function fetchKrc20BalanceOnNetwork(
  address: string,
  tick: string,
  network: Krc20BridgeNetwork,
): Promise<number> {
  const normalizedAddress = address.replace(/^kaspa:/i, '').replace(/^kaspatest:/i, '').trim();
  const normalizedTick = tick.trim().toUpperCase();
  if (!normalizedAddress || !normalizedTick) return 0;
  try {
    const res = await kasplexGet(
      network,
      `/v1/krc20/address/${encodeURIComponent(normalizedAddress)}/token/${encodeURIComponent(normalizedTick)}`,
    );
    if (!res.ok) return 0;
    const data = (await res.json()) as {
      balance?: string | number;
      amount?: string | number;
      result?: Array<{ balance?: string; dec?: string }>;
    };
    const row = Array.isArray(data.result) ? data.result[0] : null;
    const raw = row?.balance ?? data.balance ?? data.amount ?? 0;
    const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(n)) return 0;
    // Kasplex usually returns human units already; if huge integer, treat as base units.
    const dec = row?.dec != null ? Number(row.dec) : 8;
    if (Number.isInteger(n) && Math.abs(n) >= 10 ** Math.min(dec, 12) && String(Math.trunc(n)).length > 10) {
      return n / 10 ** (Number.isFinite(dec) ? dec : 8);
    }
    return n;
  } catch {
    return 0;
  }
}
