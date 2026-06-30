import { getTransactionByHash, type KaspaTxForVerification } from '@/lib/kaspa/api';

/**
 * One-shot L1 transaction verification via existing REST proxy.
 * No background polling or indexer services.
 */
export async function verifyCovenantTransaction(
  txHash: string
): Promise<KaspaTxForVerification | null> {
  return getTransactionByHash(txHash);
}

export async function waitForCovenantTransaction(
  txHash: string,
  opts?: { maxAttempts?: number; delayMs?: number }
): Promise<KaspaTxForVerification | null> {
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? 8);
  const delayMs = opts?.delayMs ?? 1500;

  for (let i = 0; i < maxAttempts; i++) {
    const tx = await verifyCovenantTransaction(txHash);
    if (tx?.outputs?.length) return tx;
    if (i < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  return null;
}
