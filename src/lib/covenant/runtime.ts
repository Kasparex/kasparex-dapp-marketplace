import type {
  CovenantRuntimeMode,
  CovenantVault,
  CreateVaultParams,
  VaultListFilter,
} from './types';
import type { CovenantWalletContext } from './context';

/**
 * Pluggable runtime boundary.
 * Swap simulator for Silverscript implementation after Toccata wallet support.
 */
export interface CovenantRuntime {
  readonly mode: CovenantRuntimeMode;
  /** Resolved mode shown in UI (hybrid may fall back). */
  readonly effectiveMode: CovenantRuntimeMode;
  createVault(
    params: CreateVaultParams,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault>;
  claimVault(
    vaultId: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault>;
  getVault(vaultId: string): Promise<CovenantVault | null>;
  listVaults(filter?: VaultListFilter): Promise<CovenantVault[]>;
}
