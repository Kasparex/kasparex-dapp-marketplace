/**
 * Extract transaction ID (TXID) from various formats.
 * Never returns `[object Object]`; prefers revealId for KRC-20 commit/reveal.
 */
export function extractTxId(txHash: string | unknown): string {
  if (txHash == null) return '';

  if (typeof txHash === 'string') {
    const trimmed = txHash.trim();
    if (!trimmed || trimmed === '[object Object]') return '';
    if (/^[0-9a-fA-F]{64}$/.test(trimmed.replace(/^0x/i, ''))) {
      return trimmed.replace(/^0x/i, '').toLowerCase();
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return extractTxId(JSON.parse(trimmed) as unknown);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (typeof txHash === 'object') {
    const obj = txHash as Record<string, unknown>;
    const candidates = [
      obj.revealId,
      obj.reveal_id,
      obj.revealTxId,
      obj.reveal_tx_id,
      obj.id,
      obj.transactionId,
      obj.transaction_id,
      obj.txHash,
      obj.hash,
      obj.txId,
      obj.commitId,
      obj.commit_id,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim() && c.trim() !== '[object Object]') {
        const nested = extractTxId(c);
        if (nested) return nested;
      }
    }
  }

  return '';
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
  if (!txId) return '#';
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
