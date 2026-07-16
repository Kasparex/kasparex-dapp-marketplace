/**
 * Covenant Lab simulator: local-only demo state (separate storage from L1 locks).
 */

import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import type { CovenantRuntime } from './runtime';
import type {
  CovenantVault,
  CreateVaultParams,
  VaultListFilter,
} from './types';
import { normalizeAddr, randomHex, loadMap, saveMap } from './utils';
import {
  isAddressInClaimers,
  isLockboxParticipant,
  normalizeCovenantClaimers,
  normalizeCovenantMemo,
  resolveVaultClaimers,
} from './participants';

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
    this.vaults = loadMap<CovenantVault>(COVENANT_LAB_CONFIG.storageKeySim);
  }

  private save(): void {
    saveMap(COVENANT_LAB_CONFIG.storageKeySim, this.vaults);
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

    const claimers = normalizeCovenantClaimers(
      params.beneficiaries?.length ? params.beneficiaries : [params.beneficiary],
    );
    const primary = claimers[0];
    const memo = normalizeCovenantMemo(params.memo, COVENANT_LAB_CONFIG.maxMemoLength);

    if (params.kind === 'timelock') {
      if (!params.unlockAt || params.unlockAt <= Date.now()) {
        throw new Error('Timelock requires a future unlock time');
      }
    }

    const id = `vault_${Date.now()}_${randomHex(4)}`;

    const vault: CovenantVault = {
      id,
      covenantId: makeCovenantId(id),
      kind: params.kind,
      status: 'locked',
      depositor: params.depositor,
      beneficiary: primary,
      beneficiaries: claimers,
      amountSompi: params.amountSompi,
      memo,
      unlockAt: params.kind === 'timelock' ? params.unlockAt : null,
      createdAt: Date.now(),
      claimedAt: null,
      lockTxHash: params.lockTxHash ?? `sim_${randomHex(16)}`,
      origin: 'simulator',
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

    const claimers = resolveVaultClaimers(vault);
    if (!isAddressInClaimers(claimers, claimer)) {
      throw new Error('Only an authorized claimer can claim this vault');
    }

    if (vault.kind === 'timelock' && vault.unlockAt && Date.now() < vault.unlockAt) {
      throw new Error('Timelock has not unlocked yet');
    }

    const updated: CovenantVault = {
      ...vault,
      beneficiaries: claimers,
      status: 'claimed',
      claimedAt: Date.now(),
      claimTxHash: `sim_claim_${randomHex(16)}`,
      origin: 'simulator',
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
      const role = filter.role ?? 'any';
      const addr = filter.address;
      list = list.filter((v) => {
        if (role === 'depositor') return normalizeAddr(v.depositor) === normalizeAddr(addr);
        if (role === 'beneficiary') return isAddressInClaimers(resolveVaultClaimers(v), addr);
        return isLockboxParticipant(v, addr);
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
