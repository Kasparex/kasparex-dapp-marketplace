import { CovenantNotReadyError } from '@/lib/programmability/errors';
import type { CovenantRuntimeMode } from './types';
import type { CovenantRuntime } from './runtime';
import type { CovenantWalletContext } from './context';
import type { CreateVaultParams, CovenantVault, VaultListFilter } from './types';
import { getCovenantSimulatorRuntime } from './simulator';
import { getSilverscriptCovenantRuntime } from './silverscript-runtime';

class HybridCovenantRuntime implements CovenantRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode: CovenantRuntimeMode = 'hybrid';
  private usedFallback = false;

  private get primary(): CovenantRuntime {
    return getSilverscriptCovenantRuntime();
  }

  private get fallback(): CovenantRuntime {
    return getCovenantSimulatorRuntime();
  }

  private effective(): CovenantRuntime {
    return this.usedFallback ? this.fallback : this.primary;
  }

  async createVault(
    params: CreateVaultParams,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    try {
      return await this.primary.createVault(params, ctx);
    } catch (err) {
      if (!(err instanceof CovenantNotReadyError)) throw err;
      this.usedFallback = true;
      return this.fallback.createVault(params, ctx);
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
      if (!(err instanceof CovenantNotReadyError)) throw err;
      this.usedFallback = true;
      return this.fallback.claimVault(vaultId, claimer, ctx);
    }
  }

  async getVault(vaultId: string): Promise<CovenantVault | null> {
    return this.effective().getVault(vaultId);
  }

  async listVaults(filter?: VaultListFilter): Promise<CovenantVault[]> {
    return this.effective().listVaults(filter);
  }
}

let hybridInstance: HybridCovenantRuntime | null = null;

export function getHybridCovenantRuntime(): HybridCovenantRuntime {
  if (!hybridInstance) hybridInstance = new HybridCovenantRuntime();
  return hybridInstance;
}
