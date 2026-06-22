export type VoucherStatus = 'open' | 'claimed' | 'expired';

export interface VoucherLock {
  id: string;
  covenantId: string;
  status: VoucherStatus;
  creator: string;
  amountSompi: string;
  /** SHA-256 hex of the claim secret (hashlock). */
  secretHash: string;
  memo: string;
  expiresAt: number;
  createdAt: number;
  lockTxHash?: string;
  claimedBy: string | null;
  claimedAt: number | null;
}

export interface CreateVoucherParams {
  creator: string;
  amountSompi: string;
  secretHash: string;
  memo: string;
  expiresAt: number;
  lockTxHash?: string;
}
