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

/** Kasplex address token routes need the full `kaspa:` / `kaspatest:` prefix; do not strip or encode the colon. */
function kasplexAddressPath(address: string, network: Krc20BridgeNetwork): string | null {
  const raw = address.trim();
  if (!raw) return null;
  if (/^kaspatest:/i.test(raw) || /^kaspa:/i.test(raw)) return raw;
  const body = raw.replace(/^kaspa:/i, '').replace(/^kaspatest:/i, '').trim();
  if (!body) return null;
  return network === 'testnet-10' ? `kaspatest:${body}` : `kaspa:${body}`;
}

export async function fetchKrc20BalanceOnNetwork(
  address: string,
  tick: string,
  network: Krc20BridgeNetwork,
): Promise<number> {
  const pathAddress = kasplexAddressPath(address, network);
  const normalizedTick = tick.trim().toUpperCase();
  if (!pathAddress || !normalizedTick) return 0;
  try {
    const res = await kasplexGet(
      network,
      `/v1/krc20/address/${pathAddress}/token/${encodeURIComponent(normalizedTick)}`,
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
    // Kasplex `/address/.../token/...` returns base units + `dec`.
    const dec = row?.dec != null ? Number(row.dec) : 8;
    const decimals = Number.isFinite(dec) && dec >= 0 && dec <= 18 ? dec : 8;
    return n / 10 ** decimals;
  } catch {
    return 0;
  }
}
