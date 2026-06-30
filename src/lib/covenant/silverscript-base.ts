import { submitCovenantTransaction } from '@/lib/programmability/tx-builder';
import { CovenantNotReadyError } from '@/lib/programmability/errors';
import { readCovenantIdField } from '@/lib/kaspa/api';
import { verifyCovenantTransaction } from '@/lib/programmability/verify';
import type { CovenantTemplate, CovenantTxResult } from '@/lib/programmability/types';
import type { CovenantWalletContext } from './context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

export async function submitTemplateCovenantTx(
  ctx: CovenantWalletContext,
  template: CovenantTemplate,
  params: Record<string, unknown>,
  spendOutpoint?: { txId: string; index: number }
): Promise<CovenantTxResult> {
  const result = await submitCovenantTransaction(ctx.provider as KaspaWalletProvider, {
    template,
    params,
    spendOutpoint,
    computeBudget: typeof params.computeBudget === 'number' ? params.computeBudget : undefined,
  });

  if (result.status === 'failed' || !result.txHash) {
    throw new Error(result.error || 'Covenant transaction failed');
  }

  if (!result.covenantId && result.txHash) {
    const tx = await verifyCovenantTransaction(result.txHash);
    const firstOut = tx?.outputs?.[0] as Record<string, unknown> | undefined;
    const covenantId = readCovenantIdField(firstOut ?? null);
    if (covenantId) {
      return { ...result, covenantId };
    }
  }

  return result;
}

export function rethrowUnlessNotReady(err: unknown): never {
  if (err instanceof CovenantNotReadyError) throw err;
  throw err instanceof Error ? err : new Error(String(err));
}
