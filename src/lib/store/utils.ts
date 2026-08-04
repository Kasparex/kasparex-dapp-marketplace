/**
 * Extract transaction ID (TXID) from various formats
 * Handles both string TXIDs and JSON objects that might contain the TXID
 */
export function extractTxId(txHash: string | unknown): string {
  if (typeof txHash === 'string') {
    // If it's already a string, check if it's a JSON object string
    try {
      const parsed = JSON.parse(txHash);
      if (typeof parsed === 'object' && parsed !== null) {
        // Try common property names for transaction ID
        return parsed.id || parsed.txHash || parsed.hash || parsed.txId || String(parsed);
      }
      return txHash;
    } catch {
      // Not JSON, return as-is
      return txHash;
    }
  }
  
  if (typeof txHash === 'object' && txHash !== null) {
    // Try common property names for transaction ID
    const obj = txHash as Record<string, unknown>;
    return String(obj.id || obj.txHash || obj.hash || obj.txId || txHash);
  }
  
  return String(txHash);
}

const KASPA_EXPLORER_MAINNET = 'https://explorer.kaspa.org';
const KASPA_EXPLORER_TESTNET_10 = 'https://tn10.kaspa.stream';

function isKaspaTestnetAddress(address: string): boolean {
  return /^kaspatest:/i.test(address.trim());
}

/**
 * Build explorer URL for a Kaspa L1 transaction.
 * Pass `testnet-10` (or a kaspatest deposit context) for TN10 txs.
 */
export function getExplorerTxUrl(
  txHash: string | unknown,
  network?: 'mainnet' | 'testnet-10',
): string {
  const txId = extractTxId(txHash);
  const base = network === 'testnet-10' ? KASPA_EXPLORER_TESTNET_10 : KASPA_EXPLORER_MAINNET;
  return `${base}/transactions/${txId}`;
}

/**
 * Build explorer URL for a Kaspa L1 address.
 * `kaspatest:` must be checked before `kaspa:` (`kaspatest`.startsWith(`kaspa`) is true).
 */
export function getKaspaExplorerAddressUrl(address: string): string {
  const addr = (address || '').trim();
  if (!addr) return '#';
  if (isKaspaTestnetAddress(addr)) {
    return `${KASPA_EXPLORER_TESTNET_10}/addresses/${addr}`;
  }
  const withPrefix = /^kaspa:/i.test(addr) ? addr : `kaspa:${addr}`;
  return `${KASPA_EXPLORER_MAINNET}/addresses/${withPrefix}`;
}
