/**
 * Kaspa REST API Service
 * 
 * Centralized service for interacting with official Kaspa REST API
 * Uses api.kaspa.org endpoints
 * 
 * Prepared for future features like:
 * - Transaction creation and submission
 * - UTXO management
 * - Address validation
 * - Network info
 */

import { isValidKaspaAddress } from './sdk';

const KASPA_API_BASE = 'https://api.kaspa.org';

/**
 * Convert sompis to KAS (1 KAS = 10^8 sompis)
 */
export function sompisToKas(sompis: number | string): number {
  const sompisNum = typeof sompis === 'string' ? parseFloat(sompis) : sompis;
  return sompisNum / 100000000;
}

/**
 * Convert KAS to sompis
 */
export function kasToSompis(kas: number): number {
  return Math.floor(kas * 100000000);
}

/**
 * Get UTXOs for an address
 * 
 * @param address - Kaspa address (with or without kaspa: prefix)
 * @returns Promise with UTXO entries
 * @throws Error if address is invalid
 */
export async function getUtxosByAddress(address: string): Promise<{
  entries?: Array<{ amount: number | string; [key: string]: any }>;
  utxos?: Array<{ amount: number | string; [key: string]: any }>;
}> {
  // Validate address using SDK
  if (!isValidKaspaAddress(address)) {
    throw new Error(`Invalid Kaspa address: ${address}`);
  }

  // Remove kaspa: prefix for API call - API expects address without prefix
  const addressWithoutPrefix = address.replace(/^kaspa:/i, '');

  console.log('Fetching UTXOs for address:', addressWithoutPrefix);
  const response = await fetch(`${KASPA_API_BASE}/v1/addresses/utxos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      addresses: [addressWithoutPrefix], // API expects address without kaspa: prefix
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  
  console.log('UTXO API response status:', response.status, response.statusText);

  if (!response.ok) {
    throw new Error(`Kaspa API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Calculate balance from UTXOs
 * 
 * @param utxos - UTXO data from getUtxosByAddress
 * @returns Balance in sompis
 */
export function calculateBalanceFromUtxos(utxos: {
  entries?: Array<{ amount: number | string; [key: string]: any }>;
  utxos?: Array<{ amount: number | string; [key: string]: any }>;
}): number {
  let totalBalance = 0;

  if (utxos.entries && Array.isArray(utxos.entries)) {
    for (const entry of utxos.entries) {
      if (entry.amount) {
        const amount = typeof entry.amount === 'string' ? parseFloat(entry.amount) : entry.amount;
        if (!isNaN(amount) && amount > 0) {
          totalBalance += amount;
        }
      }
    }
  } else if (utxos.utxos && Array.isArray(utxos.utxos)) {
    for (const utxo of utxos.utxos) {
      if (utxo.amount) {
        const amount = typeof utxo.amount === 'string' ? parseFloat(utxo.amount) : utxo.amount;
        if (!isNaN(amount) && amount > 0) {
          totalBalance += amount;
        }
      }
    }
  }

  return totalBalance;
}

/**
 * Get balance for a Kaspa address
 * 
 * @param address - Kaspa address (with or without kaspa: prefix)
 * @returns Balance in sompis
 * @throws Error if address is invalid
 */
export async function getBalance(address: string): Promise<number> {
  // Validation happens in getUtxosByAddress
  const utxos = await getUtxosByAddress(address);
  return calculateBalanceFromUtxos(utxos);
}

/**
 * Get balance in KAS for a Kaspa address
 * 
 * @param address - Kaspa address (with or without kaspa: prefix)
 * @returns Balance in KAS
 */
export async function getBalanceInKas(address: string): Promise<number> {
  const balanceInSompis = await getBalance(address);
  return sompisToKas(balanceInSompis);
}

/** KIP-20 covenant binding on a REST transaction output. */
export interface KaspaCovenantBinding {
  authorizing_input?: number;
  authorizingInput?: number;
  covenant_id?: string;
  covenantId?: string;
}

/** Minimal tx shape for L1 verification: at least one output to an address with amount (sompis) */
export interface KaspaTxOutput {
  amount?: number | string;
  scriptPublicKey?: { address?: string };
  address?: string;
  covenant?: KaspaCovenantBinding;
}

export interface KaspaTxInput {
  compute_budget?: number;
  computeBudget?: number;
  previous_outpoint_hash?: string;
  previousOutpointHash?: string;
  previous_outpoint_index?: number;
  previousOutpointIndex?: number;
}

export interface KaspaTxForVerification {
  transactionId?: string;
  id?: string;
  outputs?: KaspaTxOutput[];
  inputs?: KaspaTxInput[];
  /** @deprecated Prefer storageMass (Toccata rename of transaction storage mass). */
  mass?: number;
  /** Post-Toccata field; same value as mass when APIs emit both for compatibility. */
  storageMass?: number;
  blockHash?: string;
  version?: number;
}

const KASPA_TX_API = process.env.KASPA_TX_API_URL || 'https://api.kaspa.org';

function readStorageMassField(o: Record<string, unknown>): number | undefined {
  const candidates = [o.storageMass, o.storage_mass, o.mass];
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

/** Normalize API tx response to our shape (supports multiple API formats) */
function normalizeTxPayload(data: unknown): KaspaTxForVerification | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const txId = (o.transactionId ?? o.id ?? o.txId) as string | undefined;
  const outputs =
    (o.outputs as KaspaTxOutput[] | undefined) ??
    (o.verboseData as Record<string, unknown>)?.outputs ??
    (o.subnetworkData as Record<string, unknown>)?.outputs;
  const inputs =
    (o.inputs as KaspaTxInput[] | undefined) ??
    (o.verboseData as Record<string, unknown>)?.inputs;
  if (!txId && !outputs) return null;
  const storageMass = readStorageMassField(o);
  return {
    transactionId: txId,
    id: txId,
    outputs: Array.isArray(outputs) ? outputs : undefined,
    inputs: Array.isArray(inputs) ? inputs : undefined,
    mass: storageMass,
    storageMass,
    blockHash: o.blockHash as string | undefined,
    version: typeof o.version === 'number' ? o.version : undefined,
  };
}

/** Normalize covenant id from REST output or UTXO entry fields. */
export function readCovenantIdField(
  o: Record<string, unknown> | null | undefined
): string | undefined {
  if (!o) return undefined;
  const raw = (o.covenant_id ?? o.covenantId) as string | undefined;
  if (typeof raw === 'string' && /^[0-9a-fA-F]{64}$/.test(raw)) {
    return raw.toLowerCase();
  }
  const binding = o.covenant as KaspaCovenantBinding | undefined;
  const fromBinding = binding?.covenant_id ?? binding?.covenantId;
  if (typeof fromBinding === 'string' && /^[0-9a-fA-F]{64}$/.test(fromBinding)) {
    return fromBinding.toLowerCase();
  }
  return undefined;
}

/**
 * Fetch a Kaspa L1 transaction by hash (for vDonations L1 verification).
 * Tries primary API (api.kaspa.org or KASPA_TX_API_URL), then fallback endpoints.
 */
export async function getTransactionByHash(txHash: string): Promise<KaspaTxForVerification | null> {
  const hash = txHash.replace(/^0x/, '');
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) return null;

  const query = 'inputs=true&outputs=true&resolve_previous_outpoints=light';
  const endpoints = [
    `${KASPA_TX_API}/v1/transactions/${hash}?${query}`,
    `${KASPA_TX_API}/transactions/${hash}?${query}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      const normalized = normalizeTxPayload(data);
      if (normalized?.outputs?.length !== undefined) return normalized;
      if (normalized && (normalized.transactionId || normalized.id)) return normalized;
    } catch {
      // try next endpoint
    }
  }
  return null;
}

/** Rich tx shape from kaspa-rest-server `/transactions` and `/addresses/.../full-transactions` */
export interface KaspaRestTxOutput {
  amount?: number | string;
  script_public_key_address?: string;
  scriptPublicKeyAddress?: string;
  address?: string;
}

export interface KaspaRestTxInput {
  previous_outpoint_address?: string | null;
  previousOutpointAddress?: string | null;
}

export interface KaspaRestTransaction {
  transaction_id?: string;
  transactionId?: string;
  payload?: string | null;
  block_time?: number;
  accepting_block_time?: number;
  outputs?: KaspaRestTxOutput[];
  inputs?: KaspaRestTxInput[];
}

const KASPA_REST_BASE = process.env.KASPA_REST_API_URL || 'https://api.kaspa.org';

/**
 * Ensure address has `kaspa:` prefix for REST paths that require it.
 */
export function toKaspaRestAddress(address: string): string {
  const t = address.trim();
  if (t.toLowerCase().startsWith('kaspa:')) return t;
  return `kaspa:${t}`;
}

/**
 * Recent full transactions for an address (incoming + outgoing). Uses public indexer.
 * Path matches kaspa-rest-server OpenAPI (no `/v1` prefix on some deployments).
 * Supports `offset` paging when the deployment exposes it (e.g. api.kaspa.org: `limit`, `offset`, `resolve_previous_outpoints`).
 */
export async function getFullTransactionsForAddress(
  kaspaAddress: string,
  limit: number = 50,
  opts?: { offset?: number }
): Promise<KaspaRestTransaction[]> {
  if (!isValidKaspaAddress(kaspaAddress)) return [];
  const addr = encodeURIComponent(toKaspaRestAddress(kaspaAddress));
  const off = Math.max(0, Math.min(50_000, Math.trunc(opts?.offset ?? 0)));
  const q = `limit=${Math.min(500, Math.max(1, limit))}&offset=${off}&resolve_previous_outpoints=light`;
  const urls = [
    `${KASPA_REST_BASE}/addresses/${addr}/full-transactions?${q}`,
    `${KASPA_REST_BASE}/v1/addresses/${addr}/full-transactions?${q}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as unknown;
      if (Array.isArray(data)) return data as KaspaRestTransaction[];
    } catch {
      // next
    }
  }
  return [];
}

/**
 * Fetch a single transaction with inputs resolved (for payer checks).
 */
export async function getRestTransactionById(
  txId: string,
  options?: { maxAttempts?: number; delayMs?: number }
): Promise<KaspaRestTransaction | null> {
  const hash = txId.replace(/^0x/, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;
  const query = 'inputs=true&outputs=true&resolve_previous_outpoints=full';
  const urls = [
    `${KASPA_REST_BASE}/transactions/${hash}?${query}`,
    `${KASPA_REST_BASE}/v1/transactions/${hash}?${query}`,
  ];
  const maxAttempts = Math.max(1, options?.maxAttempts ?? 5);
  const delayMs = options?.delayMs ?? 1200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) continue;
        const data = (await res.json()) as unknown;
        if (data && typeof data === 'object') return data as KaspaRestTransaction;
      } catch {
        // next
      }
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  return null;
}

