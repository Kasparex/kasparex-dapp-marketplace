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
 */
export async function getUtxosByAddress(address: string): Promise<{
  entries?: Array<{ amount: number | string; [key: string]: any }>;
  utxos?: Array<{ amount: number | string; [key: string]: any }>;
}> {
  const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
  const fullAddress = address.startsWith('kaspa:') ? address : `kaspa:${addressWithoutPrefix}`;

  const response = await fetch(`${KASPA_API_BASE}/v1/addresses/utxos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      addresses: [fullAddress],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });

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
 */
export async function getBalance(address: string): Promise<number> {
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

