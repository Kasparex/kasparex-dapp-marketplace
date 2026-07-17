/**
 * Post-broadcast indexer settlement checks (client-side, no Hub proxy).
 */

import type { ProgrammableNetworkId } from '@/lib/programmable/config';
import { fetchKaspaComSettlementStatus } from '@/lib/programmable/kaspaComIndexerClient';

export type CovenantSettlementOutcome = {
  indexed: boolean;
  raw: Record<string, unknown> | null;
};

export async function awaitCovenantSettlement(
  txid: string,
  networkId: ProgrammableNetworkId,
  opts?: { maxAttempts?: number; delayMs?: number },
): Promise<CovenantSettlementOutcome> {
  const maxAttempts = Math.max(1, opts?.maxAttempts ?? 6);
  const baseDelay = opts?.delayMs ?? 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await fetchKaspaComSettlementStatus(txid, networkId);
    if (status && status.indexed === true) {
      return { indexed: true, raw: status };
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) => setTimeout(r, baseDelay));
    }
  }

  const last = await fetchKaspaComSettlementStatus(txid, networkId);
  return { indexed: Boolean(last?.indexed), raw: last };
}
