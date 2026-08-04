/**
 * KasWare `sendKaspa` / `signKRC20Transaction` often return a full object
 * (`{ id }`, `{ revealId, commitId }`, …) instead of a bare 64-hex id.
 */
export function extractKaspaTransactionId(result: unknown): string | null {
  if (result == null) return null;

  if (typeof result === 'string') {
    const t = result.trim().replace(/^0x/i, '');
    if (/^[0-9a-fA-F]{64}$/.test(t)) return t.toLowerCase();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return extractKaspaTransactionId(JSON.parse(t) as unknown);
      } catch {
        return null;
      }
    }
    return null;
  }

  if (typeof result === 'object') {
    const o = result as Record<string, unknown>;
    const candidates = [
      o.revealId,
      o.reveal_id,
      o.revealTxId,
      o.reveal_tx_id,
      o.id,
      o.transactionId,
      o.transaction_id,
      o.txHash,
      o.txId,
      o.hash,
      o.commitId,
      o.commit_id,
      o.commitTxId,
      o.commit_tx_id,
    ];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) {
        const found = extractKaspaTransactionId(c);
        if (found) return found;
      }
    }
  }

  return null;
}
