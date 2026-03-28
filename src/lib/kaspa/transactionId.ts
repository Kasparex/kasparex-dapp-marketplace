/**
 * KasWare `sendKaspa` often returns a full transaction object `{ id, inputs, outputs, ... }`
 * instead of a bare transaction id string. APIs expect a 64-char lowercase hex id.
 */
export function extractKaspaTransactionId(result: unknown): string | null {
  if (result == null) return null;

  if (typeof result === 'string') {
    const t = result.trim().replace(/^0x/i, '');
    if (/^[0-9a-fA-F]{64}$/.test(t)) return t.toLowerCase();
    if (t.startsWith('{')) {
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
      o.id,
      o.transactionId,
      o.transaction_id,
      o.txHash,
      o.txId,
      o.hash,
    ];
    for (const c of candidates) {
      if (typeof c === 'string') {
        const h = c.trim().replace(/^0x/i, '');
        if (/^[0-9a-fA-F]{64}$/.test(h)) return h.toLowerCase();
      }
    }
  }

  return null;
}
