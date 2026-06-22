import type {
  CovenantRuntimeMode,
  CovenantVault,
  CreateVaultParams,
  VaultListFilter,
} from './types';

/**
 * Pluggable runtime boundary.
 * Swap `CovenantSimulatorRuntime` for a Silverscript / node RPC implementation after Toccata.
 */
export interface CovenantRuntime {
  readonly mode: CovenantRuntimeMode;
  createVault(params: CreateVaultParams): Promise<CovenantVault>;
  claimVault(vaultId: string, claimer: string): Promise<CovenantVault>;
  getVault(vaultId: string): Promise<CovenantVault | null>;
  listVaults(filter?: VaultListFilter): Promise<CovenantVault[]>;
}
