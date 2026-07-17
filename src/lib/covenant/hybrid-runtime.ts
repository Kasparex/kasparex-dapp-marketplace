import { CovenantNotReadyError } from '@/lib/programmability/errors';
import type { CovenantRuntimeMode } from './types';
import type { CovenantRuntime } from './runtime';
import type { CovenantWalletContext } from './context';
import type { CreateVaultParams, CovenantVault, VaultListFilter } from './types';
import { getSilverscriptCovenantRuntime } from './silverscript-runtime';

/**
 * Hybrid LockBox runtime: prefer real L1 (silverscript).
 * Simulator fallback is disabled so demo rows cannot mix with mainnet locks.
 */
class HybridCovenantRuntime implements CovenantRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode: CovenantRuntimeMode = 'hybrid';

  private get primary(): CovenantRuntime {
    return getSilverscriptCovenantRuntime();
  }

  async createVault(
    params: CreateVaultParams,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    try {
      return await this.primary.createVault(params, ctx);
    } catch (err) {
      if (err instanceof CovenantNotReadyError) {
        throw new CovenantNotReadyError(
          `${err.message} Local simulator fallback is disabled for LockBox. Connect a wallet with signPskt + pushTx.`,
        );
      }
      throw err;
    }
  }

  async claimVault(
    vaultId: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    try {
      return await this.primary.claimVault(vaultId, claimer, ctx);
    } catch (err) {
      if (err instanceof CovenantNotReadyError) {
        throw new CovenantNotReadyError(
          `${err.message} Local simulator fallback is disabled for LockBox.`,
        );
      }
      throw err;
    }
  }

  async reclaimVault(
    vaultId: string,
    depositor: string,
    ctx: CovenantWalletContext,
  ): Promise<CovenantVault> {
    if (!this.primary.reclaimVault) {
      throw new Error('Reclaim is not supported by this runtime');
    }
    try {
      return await this.primary.reclaimVault(vaultId, depositor, ctx);
    } catch (err) {
      if (err instanceof CovenantNotReadyError) {
        throw new CovenantNotReadyError(
          `${err.message} Local simulator fallback is disabled for LockBox.`,
        );
      }
      throw err;
    }
  }

  async getVault(vaultId: string): Promise<CovenantVault | null> {
    return this.primary.getVault(vaultId);
  }

  async listVaults(filter?: VaultListFilter): Promise<CovenantVault[]> {
    return this.primary.listVaults(filter);
  }
}

let hybridInstance: HybridCovenantRuntime | null = null;

export function getHybridCovenantRuntime(): HybridCovenantRuntime {
  if (!hybridInstance) hybridInstance = new HybridCovenantRuntime();
  return hybridInstance;
}
