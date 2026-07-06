import { CovenantNotReadyError } from '@/lib/programmability/errors';
import { executeLegacyTemplateTx } from './execution/execute';
import type { CovenantTemplate, CovenantTxResult } from '@/lib/programmability/types';
import type { CovenantWalletContext } from './context';

export { executeCovenantDeploy, executeCovenantSpend } from './execution/execute';

export async function submitTemplateCovenantTx(
  ctx: CovenantWalletContext,
  template: CovenantTemplate,
  params: Record<string, unknown>,
  spendOutpoint?: { txId: string; index: number },
): Promise<CovenantTxResult> {
  return executeLegacyTemplateTx(ctx, template, params, spendOutpoint);
}

export function rethrowUnlessNotReady(err: unknown): never {
  if (err instanceof CovenantNotReadyError) throw err;
  throw err instanceof Error ? err : new Error(String(err));
}
