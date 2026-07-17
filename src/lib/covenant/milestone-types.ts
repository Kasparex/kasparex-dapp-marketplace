import type { CovenantUtxoRef } from './types';

export type MilestoneDealStatus = 'active' | 'completed';

export interface MilestoneStep {
  id: string;
  label: string;
  shareBps: number;
  amountSompi: string;
  unlockAt: number;
  claimed: boolean;
  claimedAt: number | null;
  claimTxHash?: string;
  covenantId?: string;
  lockTxHash?: string;
  claimFeeTxHash?: string;
  utxo?: CovenantUtxoRef;
  origin?: 'l1' | 'simulator';
}

export interface MilestoneDeal {
  id: string;
  covenantId: string;
  status: MilestoneDealStatus;
  depositor: string;
  beneficiary: string;
  totalSompi: string;
  memo: string;
  milestones: MilestoneStep[];
  createdAt: number;
  lockTxHash?: string;
  origin?: 'l1' | 'simulator';
}

export interface MilestoneInput {
  label: string;
  shareBps: number;
  unlockAt: number;
}

export interface CreateMilestoneParams {
  depositor: string;
  beneficiary: string;
  totalSompi: string;
  memo: string;
  milestones: MilestoneInput[];
  lockTxHash?: string;
}
