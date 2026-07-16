import { CovenantNotReadyError } from '@/lib/programmability/errors';
import type { CovenantRuntimeMode } from './types';
import type { CovenantRuntime } from './runtime';
import type { CovenantWalletContext } from './context';
import type { CreateVaultParams, CovenantVault, VaultListFilter } from './types';
import { getSilverscriptCovenantRuntime } from './silverscript-runtime';

/**
 * Hybrid LockBox runtime: prefer real L1 (silverscript).
 * Simulator fallback no longer writes into the Vaults list, so demo rows cannot
 * mix with mainnet locks (that caused escrow/memo confusion).
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
          `${err.message} Simulator fallback is disabled for LockBox Vaults so local demos cannot mix with real locks. Use NEXT_PUBLIC_COVENANT_RUNTIME=simulator only for offline demos.`,
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
          `${err.message} Simulator fallback is disabled for LockBox Vaults.`,
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
