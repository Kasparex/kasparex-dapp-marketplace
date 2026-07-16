import type { UnsignedCovenantTx, BuildSpendInput } from './types';
import { CovenantNotReadyError } from '@/lib/programmability/errors';

/**
 * Spend / claim builder placeholder.
 * Deploy path is live; spend needs ABI sigscript encoding (ScriptBuilder + entrypoint args)
 * matching KaspaCom `spendContract`. Template plugins can override per-contract.
 */
export async function buildGenericUnsignedSpend(
  input: BuildSpendInput,
): Promise<UnsignedCovenantTx> {
  void input;
  throw new CovenantNotReadyError(
    `Unsigned spend builder for "${input.template}" / ${input.functionName} is not implemented yet. Deploy uses the shared P2SH genesis builder; claim/spend will follow the same signPskt path once ABI sigscripts are wired.`,
  );
}
