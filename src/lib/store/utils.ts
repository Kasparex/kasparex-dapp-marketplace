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

/**
 * Build explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string | unknown): string {
  const txId = extractTxId(txHash);
  return `https://explorer.kaspa.org/transactions/${txId}`;
}
