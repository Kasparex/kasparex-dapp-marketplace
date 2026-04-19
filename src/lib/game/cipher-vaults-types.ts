import type { CipherVaultTierId } from '@/lib/game/cipher-vaults-config';

export type CipherPaymentType = 'KAS' | 'TICKET';

export interface CipherRun {
  runId: string;
  tierId: CipherVaultTierId;
  seed: string;
  startedAt: number;
  paidBy: CipherPaymentType;
  entryTxHash?: string;
}

export interface CipherLedgerEntry {
  id: string;
  runId: string;
  tierId: CipherVaultTierId;
  solvedAt: number;
  moves: number;
  moveLimit: number;
  entryTxHash?: string;
}

export interface CipherVaultsState {
  version: number;
  lastConnectedAt: number | null;
  /** Total refinement points redeemed (monotonic). */
  redeemedRefinementPointsTotal: number;
  /** Tickets spent (monotonic). */
  ticketsSpent: number;
  activeRun: CipherRun | null;
  ledger: CipherLedgerEntry[];
}

export function createInitialCipherVaultsState(): CipherVaultsState {
  return {
    version: 1,
    lastConnectedAt: null,
    redeemedRefinementPointsTotal: 0,
    ticketsSpent: 0,
    activeRun: null,
    ledger: [],
  };
}

