/**
 * Optional KCC20 (wrapped) KREX balance for Hub tier parity.
 * Uses kcc20.info balance projections when NEXT_PUBLIC_KREX_KCC20_COVENANT_ID is set.
 */

import { stripKaspaAddressHrp } from '@/lib/kaspa/sdk';
import { DEFAULT_PROGRAMMABLE_NETWORK } from '@/lib/programmable/config';
import { getKrexKcc20CovenantId, getKrexWrapDecimals } from './wrap/config';

const FETCH_TIMEOUT_MS = 12_000;

type BalanceRow = {
  amount?: string | number | null;
  balance?: string | number | null;
  qty?: string | number | null;
};

function requestUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') {
    const base = (process.env.NEXT_PUBLIC_KCC20_INFO_BASE || 'https://kcc20.info').replace(/\/$/, '');
    return `${base}${normalized}`;
  }
  return `/api/kcc20-indexer?endpoint=${encodeURIComponent(normalized)}`;
}

function parseAmount(raw: unknown, decimals: number): number {
  if (raw == null) return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Heuristic: large integers are base units.
    if (Number.isInteger(raw) && Math.abs(raw) >= 10 ** decimals) {
      return raw / 10 ** decimals;
    }
    return raw;
  }
  const s = String(raw).trim();
  if (!s) return 0;
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n)) return 0;
    return n / 10 ** decimals;
  }
  const f = Number(s);
  return Number.isFinite(f) ? f : 0;
}

/**
 * Query wrapped KREX (KCC20) balance for a Kaspa address.
 * Returns 0 when covenant is not configured or indexer has no row.
 */
export async function queryKcc20KrexBalance(kaspaAddress: string | null): Promise<number> {
  const covenantId = getKrexKcc20CovenantId();
  if (!covenantId || !kaspaAddress) return 0;
  if (DEFAULT_PROGRAMMABLE_NETWORK !== 'mainnet') return 0;

  const addr = stripKaspaAddressHrp(kaspaAddress);
  if (!addr) return 0;
  const decimals = getKrexWrapDecimals();

  const candidates = [
    `/v1/tokens/${covenantId}/balances/${encodeURIComponent(addr)}`,
    `/v1/tokens/${covenantId}/holders/${encodeURIComponent(addr)}`,
    `/v1/balances/${covenantId}/${encodeURIComponent(addr)}`,
  ];

  for (const path of candidates) {
    try {
      const res = await fetch(requestUrl(path), {
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as BalanceRow & { data?: BalanceRow };
      const row = json?.data ?? json;
      const amount = parseAmount(row.amount ?? row.balance ?? row.qty, decimals);
      if (amount >= 0) return amount;
    } catch {
      // try next shape
    }
  }

  return 0;
}
