export type KrexWrapStatus =
  | 'draft'
  | 'fee_paid'
  | 'deposited'
  | 'pending_mint'
  | 'minted'
  | 'failed';

export type KrexWrapRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  wallet: string;
  amountKrex: number;
  feeKas: number;
  feeTxHash?: string;
  depositTxHash?: string;
  mintTxHash?: string;
  status: KrexWrapStatus;
  note?: string;
};

export type KrexWrapPublicConfig = {
  vaultAddress: string | null;
  treasuryAddress: string | null;
  kcc20CovenantId: string | null;
  tick: string;
  decimals: number;
  baseFeeKas: number;
  minWrapKrex: number;
  unwrapEnabled: boolean;
  mintLive: boolean;
  ready: boolean;
};
