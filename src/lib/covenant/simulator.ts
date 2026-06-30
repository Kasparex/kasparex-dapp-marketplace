/**
 * Covenant Lab simulator: local covenant state until Silverscript mainnet + wallet covenant txs.
 */

import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import { buildLockboxCommitNote } from './payload';
import { maybePayLegacyTreasury, shouldUseLegacyTreasury } from './legacy-treasury';
import type { CovenantRuntime } from './runtime';
import type {
  CovenantVault,
  CreateVaultParams,
  VaultListFilter,
} from './types';
import { normalizeAddr, randomHex } from './utils';

function makeCovenantId(vaultId: string): string {
  return `cov_${vaultId.slice(0, 8)}_${randomHex(8)}`;
}

class CovenantSimulatorRuntime implements CovenantRuntime {
  readonly mode = 'simulator' as const;
  readonly effectiveMode = 'simulator' as const;

  private vaults: Map<string, CovenantVault> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(COVENANT_LAB_CONFIG.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as [string, CovenantVault][];
      this.vaults = new Map(parsed);
    } catch {
      this.vaults = new Map();
    }
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      COVENANT_LAB_CONFIG.storageKey,
      JSON.stringify(Array.from(this.vaults.entries()))
    );
  }

  async createVault(
    params: CreateVaultParams,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    requireCovenantContext(ctx);
    const amount = BigInt(params.amountSompi);
    const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
    if (amount < min) {
      throw new Error(`Minimum lock is ${Number(min) / 1e8} KAS`);
    }

    if (!params.beneficiary?.trim()) {
      throw new Error('Beneficiary address is required');
    }

    if (params.kind === 'timelock') {
      if (!params.unlockAt || params.unlockAt <= Date.now()) {
        throw new Error('Timelock requires a future unlock time');
      }
    }

    if (params.memo.length > COVENANT_LAB_CONFIG.maxMemoLength) {
      throw new Error(`Memo max ${COVENANT_LAB_CONFIG.maxMemoLength} characters`);
    }

    const id = `vault_${Date.now()}_${randomHex(4)}`;
    let lockTxHash = params.lockTxHash;

    if (shouldUseLegacyTreasury(this.mode)) {
      lockTxHash = await maybePayLegacyTreasury({
        ctx,
        amountSompi: params.amountSompi,
        note: buildLockboxCommitNote({
          vaultId: id,
          kind: params.kind,
          beneficiary: params.beneficiary,
          amountSompi: params.amountSompi,
        }),
        dappId: 'covenant-lab',
        actionType: 'covenant-lock',
        amountKas: Number(BigInt(params.amountSompi)) / 1e8,
        useLegacy: true,
      });
    }

    const vault: CovenantVault = {
      id,
      covenantId: makeCovenantId(id),
      kind: params.kind,
      status: 'locked',
      depositor: params.depositor,
      beneficiary: params.beneficiary,
      amountSompi: params.amountSompi,
      memo: params.memo.trim(),
      unlockAt: params.kind === 'timelock' ? params.unlockAt : null,
      createdAt: Date.now(),
      claimedAt: null,
      lockTxHash,
    };

    this.vaults.set(id, vault);
    this.save();
    return vault;
  }

  async claimVault(
    vaultId: string,
    claimer: string,
    _ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    const vault = this.vaults.get(vaultId);
    if (!vault) throw new Error('Vault not found');
    if (vault.status === 'claimed') throw new Error('Vault already claimed');

    const claimerNorm = normalizeAddr(claimer);
    const beneficiaryNorm = normalizeAddr(vault.beneficiary);
    if (claimerNorm !== beneficiaryNorm) {
      throw new Error('Only the beneficiary can claim this vault');
    }

    if (vault.kind === 'timelock' && vault.unlockAt && Date.now() < vault.unlockAt) {
      throw new Error('Timelock has not unlocked yet');
    }

    const updated: CovenantVault = {
      ...vault,
      status: 'claimed',
      claimedAt: Date.now(),
      claimTxHash: `sim_claim_${randomHex(16)}`,
    };
    this.vaults.set(vaultId, updated);
    this.save();
    return updated;
  }

  async getVault(vaultId: string): Promise<CovenantVault | null> {
    return this.vaults.get(vaultId) ?? null;
  }

  async listVaults(filter?: VaultListFilter): Promise<CovenantVault[]> {
    let list = Array.from(this.vaults.values()).sort((a, b) => b.createdAt - a.createdAt);

    if (filter?.status) {
      list = list.filter((v) => v.status === filter.status);
    }

    if (filter?.address) {
      const norm = normalizeAddr(filter.address);
      const role = filter.role ?? 'any';
      list = list.filter((v) => {
        const dep = normalizeAddr(v.depositor);
        const ben = normalizeAddr(v.beneficiary);
        if (role === 'depositor') return dep === norm;
        if (role === 'beneficiary') return ben === norm;
        return dep === norm || ben === norm;
      });
    }

    return list;
  }
}

let instance: CovenantSimulatorRuntime | null = null;

export function getCovenantSimulatorRuntime(): CovenantSimulatorRuntime {
  if (!instance) instance = new CovenantSimulatorRuntime();
  return instance;
}
