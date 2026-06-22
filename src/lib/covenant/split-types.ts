/**
 * Covenant split payment types (1:N fan-out prototype).
 */

export type SplitPaymentStatus = 'open' | 'completed';

export interface SplitRecipient {
  id: string;
  address: string;
  /** Basis points; 10_000 = 100%. */
  shareBps: number;
  amountSompi: string;
  claimed: boolean;
  claimedAt: number | null;
  claimTxHash?: string;
}

export interface SplitPayment {
  id: string;
  covenantId: string;
  status: SplitPaymentStatus;
  depositor: string;
  totalSompi: string;
  memo: string;
  recipients: SplitRecipient[];
  createdAt: number;
  lockTxHash?: string;
}

export interface SplitRecipientInput {
  address: string;
  shareBps: number;
}

export interface CreateSplitParams {
  depositor: string;
  totalSompi: string;
  memo: string;
  recipients: SplitRecipientInput[];
  lockTxHash?: string;
}

export interface SplitListFilter {
  address?: string;
  role?: 'depositor' | 'recipient' | 'any';
  status?: SplitPaymentStatus;
}
