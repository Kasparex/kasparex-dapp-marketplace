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

function mapHubProxyTransaction(raw: Record<string, unknown>): KaspaRestTransaction | null {
  const txId =
    (typeof raw.transactionId === 'string' && raw.transactionId) ||
    (typeof raw.transaction_id === 'string' && raw.transaction_id) ||
    (typeof raw.id === 'string' && raw.id) ||
    (typeof raw.txId === 'string' && raw.txId) ||
    undefined;
  const outputs = raw.outputs;
  const inputs = raw.inputs;
  if (!txId && !Array.isArray(outputs)) return null;
  return {
    transaction_id: txId,
    transactionId: txId,
    payload: typeof raw.payload === 'string' ? raw.payload : null,
    outputs: Array.isArray(outputs) ? (outputs as KaspaRestTxOutput[]) : [],
    inputs: Array.isArray(inputs) ? (inputs as KaspaRestTxInput[]) : [],
  };
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

/**
 * Fetch a Kaspa REST transaction by id.
 * Tries public REST (with timeout), then the Hub `/api/kaspa/transaction` proxy when configured.
 */
export async function fetchKaspaRestTransaction(env: Env, txId: string): Promise<KaspaRestTransaction | null> {
  const hash = normalizeKaspaTxid(txId);
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;

  const query = 'inputs=true&outputs=true&resolve_previous_outpoints=full';
  for (const base of restBaseUrls(env)) {
    const urls = [
      `${base}/v1/transactions/${hash}?${query}`,
      `${base}/transactions/${hash}?${query}`,
    ];
    for (const url of urls) {
      const data = await fetchJsonWithTimeout(url, 12_000);
      if (data && typeof data === 'object') {
        return data as KaspaRestTransaction;
      }
    }
  }

  const appBase = (env.KASPAREX_APP_URL || 'https://kasparex.com').replace(/\/$/, '');
  const proxyUrl = `${appBase}/api/kaspa/transaction/${hash}?resolve=full`;
  const proxyData = await fetchJsonWithTimeout(proxyUrl, 22_000);
  if (proxyData && typeof proxyData === 'object') {
    const body = proxyData as Record<string, unknown>;
    if (body.success === true && body.transaction && typeof body.transaction === 'object') {
      return mapHubProxyTransaction(body.transaction as Record<string, unknown>);
    }
    if (!('success' in body) && (body.outputs || body.transactionId || body.transaction_id)) {
      return mapHubProxyTransaction(body);
    }
  }

  return null;
}
