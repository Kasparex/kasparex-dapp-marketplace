import type {
  CreateSplitParams,
  SplitListFilter,
  SplitPayment,
} from './split-types';

export interface SplitPaymentRuntime {
  createSplit(params: CreateSplitParams): Promise<SplitPayment>;
  claimShare(splitId: string, recipientId: string, claimer: string): Promise<SplitPayment>;
  getSplit(splitId: string): Promise<SplitPayment | null>;
  listSplits(filter?: SplitListFilter): Promise<SplitPayment[]>;
}
