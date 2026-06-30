import type {
  CreateSplitParams,
  SplitListFilter,
  SplitPayment,
} from './split-types';
import type { CovenantWalletContext } from './context';
import type { CovenantRuntimeMode } from './types';

export interface SplitPaymentRuntime {
  readonly mode: CovenantRuntimeMode;
  readonly effectiveMode: CovenantRuntimeMode;
  createSplit(params: CreateSplitParams, ctx: CovenantWalletContext): Promise<SplitPayment>;
  claimShare(
    splitId: string,
    recipientId: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<SplitPayment>;
  getSplit(splitId: string): Promise<SplitPayment | null>;
  listSplits(filter?: SplitListFilter): Promise<SplitPayment[]>;
}
