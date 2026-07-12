import type { Env } from '../index';

export type KaspaRestTxOutput = {
  amount?: number | string;
  script_public_key_address?: string;
  scriptPublicKeyAddress?: string;
  address?: string;
  script_public_key?: { address?: string };
  scriptPublicKey?: { address?: string };
};

export type KaspaRestTxInput = {
  previous_outpoint_address?: string | null;
  previousOutpointAddress?: string | null;
  verboseData?: { address?: string } | null;
  verbose_data?: { address?: string } | null;
};

export type KaspaRestTransaction = {
  transaction_id?: string;
  transactionId?: string;
  payload?: string | null;
  verboseData?: { payload?: string } | null;
  verbose_data?: { payload?: string } | null;
  outputs?: KaspaRestTxOutput[];
  inputs?: KaspaRestTxInput[];
};

function normalizeKaspaTxid(txid: string): string {
  return txid.replace(/^0x/i, '').trim().toLowerCase();
}

function restBaseUrls(env: Env): string[] {
  const bases = new Set<string>();
  const configured = (env.KASPA_REST_API_URL || '').trim().replace(/\/$/, '');
  if (configured) bases.add(configured);
  bases.add('https://api.kaspa.org');
  return [...bases];
}

function coerceRestTransaction(data: unknown): KaspaRestTransaction | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  if (o.transaction && typeof o.transaction === 'object') {
    return coerceRestTransaction(o.transaction);
  }
  const txId = o.transaction_id ?? o.transactionId ?? o.id ?? o.txId;
  if (typeof txId === 'string' || Array.isArray(o.outputs)) {
    return o as KaspaRestTransaction;
  }
  return null;
}

function mapHubProxyTransaction(raw: Record<string, unknown>): KaspaRestTransaction | null {
  return coerceRestTransaction(raw);
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

function txUrls(base: string, hash: string): string[] {
  const b = base.replace(/\/$/, '');
  return [
    `${b}/transactions/${hash}`,
    `${b}/transactions/${hash}?inputs=true&outputs=true`,
    `${b}/transactions/${hash}?inputs=true&outputs=true&resolve_previous_outpoints=light`,
    `${b}/v1/transactions/${hash}?inputs=true&outputs=true&resolve_previous_outpoints=light`,
  ];
}

async function fetchTxFromAddressHistory(
  toAddress: string,
  txHash: string
): Promise<KaspaRestTransaction | null> {
  const hash = normalizeKaspaTxid(txHash);
  const addr = toAddress.trim();
  const withPrefix = addr.toLowerCase().startsWith('kaspa:') ? addr : `kaspa:${addr}`;
  const url = `https://api.kaspa.org/addresses/${encodeURIComponent(withPrefix)}/full-transactions?limit=40`;
  const data = await fetchJsonWithTimeout(url, 18_000);
  const list = Array.isArray(data) ? data : (data as Record<string, unknown> | null)?.value;
  if (!Array.isArray(list)) return null;
  for (const item of list) {
    const tx = coerceRestTransaction(item);
    if (!tx) continue;
    const id = normalizeKaspaTxid(String(tx.transaction_id ?? tx.transactionId ?? ''));
    if (id === hash) return tx;
  }
  return null;
}

/**
 * Fetch a Kaspa REST transaction by id.
 * Tries plain `/transactions/{id}` first (most reliable on api.kaspa.org), then enriched queries,
 * recipient address history, and finally the Hub `/api/kaspa/transaction` proxy.
 */
export async function fetchKaspaRestTransaction(
  env: Env,
  txId: string,
  options?: { recipientAddress?: string | null }
): Promise<KaspaRestTransaction | null> {
  const hash = normalizeKaspaTxid(txId);
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;

  for (const base of restBaseUrls(env)) {
    for (const url of txUrls(base, hash)) {
      const data = await fetchJsonWithTimeout(url, 12_000);
      const tx = coerceRestTransaction(data);
      if (tx?.outputs?.length || tx?.transaction_id || tx?.transactionId) {
        return tx;
      }
    }
  }

  const recipient = options?.recipientAddress || env.NODE_VERIFY_TO_ADDRESS || null;
  if (recipient) {
    const fromScan = await fetchTxFromAddressHistory(recipient, hash);
    if (fromScan) return fromScan;
  }

  const appBase = (env.KASPAREX_APP_URL || 'https://kasparex.com').replace(/\/$/, '');
  const proxyUrl = `${appBase}/api/kaspa/transaction/${hash}`;
  const proxyData = await fetchJsonWithTimeout(proxyUrl, 22_000);
  if (proxyData && typeof proxyData === 'object') {
    const body = proxyData as Record<string, unknown>;
    if (body.success === true && body.transaction && typeof body.transaction === 'object') {
      return mapHubProxyTransaction(body.transaction as Record<string, unknown>);
    }
    const direct = coerceRestTransaction(body);
    if (direct) return direct;
  }

  return null;
}
