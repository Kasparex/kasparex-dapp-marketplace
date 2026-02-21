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

/** Minimal tx shape for L1 verification: at least one output to an address with amount (sompis) */
export interface KaspaTxOutput {
  amount?: number | string;
  scriptPublicKey?: { address?: string };
  address?: string;
}

export interface KaspaTxForVerification {
  transactionId?: string;
  id?: string;
  outputs?: KaspaTxOutput[];
  mass?: number;
  blockHash?: string;
}

const KASPA_TX_API = process.env.KASPA_TX_API_URL || 'https://api.kaspa.org';

/**
 * Fetch a Kaspa L1 transaction by hash (for vDonations L1 verification).
 * Tries api.kaspa.org or KASPA_TX_API_URL (e.g. explorer API).
 */
export async function getTransactionByHash(txHash: string): Promise<KaspaTxForVerification | null> {
  const hash = txHash.replace(/^0x/, '');
  if (!/^[0-9a-fA-F]{64}$/.test(hash)) return null;
  try {
    const res = await fetch(`${KASPA_TX_API}/v1/transactions/${hash}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return (await res.json()) as KaspaTxForVerification;
  } catch {
    return null;
  }
}

