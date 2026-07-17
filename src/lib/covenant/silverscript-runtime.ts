import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext, covenantNetworkIdFromContext } from './context';
import type { CovenantRuntime } from './runtime';
import type {
  CovenantVault,
  CreateVaultParams,
  VaultListFilter,
} from './types';
import {
  executeCovenantDeploy,
  executeCovenantSpend,
  KPX_COVENANT_PAYLOAD_TEMPLATES,
} from './execution';
import { loadKaspaComCompiledContract, resolveSpendFunctionName } from './execution/artifacts';
import { normalizeAddr, randomHex, randomId } from './utils';
import { loadL1LockboxVaults, saveL1LockboxVaults } from './lockbox-storage';
import {
  isAddressInClaimers,
  isLockboxParticipant,
  normalizeCovenantClaimers,
  normalizeCovenantMemo,
  resolveVaultClaimers,
} from './participants';

class SilverscriptCovenantRuntime implements CovenantRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;

  private vaults = loadL1LockboxVaults();

  private persist(): void {
    saveL1LockboxVaults(this.vaults);
  }

  private reload(): void {
    this.vaults = loadL1LockboxVaults();
  }

  private normalizeStoredVault(vault: CovenantVault): CovenantVault {
    const claimers = resolveVaultClaimers(vault);
    const memo = normalizeCovenantMemo(vault.memo, COVENANT_LAB_CONFIG.maxMemoLength);
    return {
      ...vault,
      beneficiary: claimers[0] ?? vault.beneficiary,
      beneficiaries: claimers,
      memo,
    };
  }

  async createVault(
    params: CreateVaultParams,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    requireCovenantContext(ctx);
    this.reload();

    const amount = BigInt(params.amountSompi);
    const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
    if (amount < min) throw new Error(`Minimum lock is ${Number(min) / 1e8} KAS`);

    const claimers = normalizeCovenantClaimers(
      params.beneficiaries?.length
        ? params.beneficiaries
        : [params.beneficiary],
    );
    const primary = claimers[0];
    const memo = normalizeCovenantMemo(params.memo, COVENANT_LAB_CONFIG.maxMemoLength);

    if (params.kind === 'timelock') {
      if (!params.unlockAt || params.unlockAt <= Date.now()) {
        throw new Error('Timelock requires a future unlock time');
      }
      if (params.deadlineAt != null) {
        if (params.deadlineAt <= params.unlockAt) {
          throw new Error('Deadline must be after the unlock time');
        }
      }
    }

    const unlockSeconds =
      params.kind === 'timelock' && params.unlockAt
        ? Math.floor(params.unlockAt / 1000)
        : 0;
    const deadlineMs =
      params.kind === 'timelock' ? params.deadlineAt ?? null : null;
    const deadlineSeconds = deadlineMs ? Math.floor(deadlineMs / 1000) : 0;

    const networkId = covenantNetworkIdFromContext(ctx);
    const tx = await executeCovenantDeploy(ctx, {
      template: 'lockbox',
      amountSompi: params.amountSompi,
      networkId,
      payloadTemplate: KPX_COVENANT_PAYLOAD_TEMPLATES.lockbox,
      payloadArgs: [
        { name: 'beneficiary', type: 'address', value: primary },
        { name: 'depositor', type: 'address', value: params.depositor.trim() },
        { name: 'unlockTimeMs', type: 'u64', value: String(unlockSeconds * 1000) },
        { name: 'deadlineTimeMs', type: 'u64', value: String(deadlineSeconds * 1000) },
        { name: 'kind', type: 'string', value: params.kind },
        { name: 'memo', type: 'string', value: memo },
        {
          name: 'claimers',
          type: 'string',
          value: claimers.join(','),
        },
      ],
      payloadMeta: {
        ...(memo ? { label: memo.slice(0, 80) } : {}),
        claimerCount: String(claimers.length),
      },
      params: {
        kind: params.kind,
        beneficiary: primary,
        beneficiaries: claimers,
        depositor: params.depositor,
        unlockTime: unlockSeconds,
        deadlineTime: deadlineSeconds,
        memo,
      },
    });

    const id = randomId('vault');
    const vault: CovenantVault = {
      id,
      covenantId: tx.covenantId ?? `pending_${randomHex(16)}`,
      kind: params.kind,
      status: 'locked',
      depositor: params.depositor,
      beneficiary: primary,
      beneficiaries: claimers,
      amountSompi: params.amountSompi,
      shareBps: params.shareBps,
      groupId: params.groupId,
      memo,
      unlockAt: params.kind === 'timelock' ? params.unlockAt : null,
      deadlineAt: deadlineMs,
      createdAt: Date.now(),
      claimedAt: null,
      lockTxHash: tx.txHash,
      utxo: tx.outpoint ?? { txId: tx.txHash, index: 0 },
      origin: 'l1',
    };

    this.vaults.set(id, vault);
    this.persist();
    return vault;
  }

  async claimVault(
    vaultId: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    requireCovenantContext(ctx);
    this.reload();

    const raw = this.vaults.get(vaultId);
    if (!raw) throw new Error('Vault not found');
    let vault = this.normalizeStoredVault(raw);
    if (vault.status === 'claimed') throw new Error('Vault already claimed');

    const claimers = resolveVaultClaimers(vault);
    if (!isAddressInClaimers(claimers, claimer)) {
      throw new Error('Only an authorized claimer can claim this vault');
    }
    if (vault.kind === 'timelock' && vault.unlockAt && Date.now() < vault.unlockAt) {
      throw new Error('Timelock has not unlocked yet');
    }
    if (vault.kind === 'timelock' && vault.deadlineAt && Date.now() >= vault.deadlineAt) {
      throw new Error('Claim deadline has passed. Only the creator can reclaim now.');
    }
    if (!vault.utxo?.txId && vault.lockTxHash) {
      const utxo = { txId: vault.lockTxHash, index: 0 };
      vault = { ...vault, utxo };
      this.vaults.set(vaultId, vault);
      this.persist();
    }
    if (!vault.utxo) {
      throw new Error(
        'Vault is missing on-chain UTXO reference. Create a new lock to claim on L1.',
      );
    }

    const compiled = await loadKaspaComCompiledContract('lockbox');
    const functionName = resolveSpendFunctionName(compiled, 'claim');

    const tx = await executeCovenantSpend(ctx, {
      template: 'lockbox',
      networkId: covenantNetworkIdFromContext(ctx),
      functionName,
      spendOutpoint: { txid: vault.utxo.txId, vout: vault.utxo.index },
      inputAmountSompi: vault.amountSompi,
      outputs: [{ address: claimer.trim(), amountSompi: vault.amountSompi }],
      params: {
        action: 'claim',
        vaultId,
        beneficiary: claimer.trim(),
      },
    });

    const updated: CovenantVault = {
      ...vault,
      status: 'claimed',
      claimedAt: Date.now(),
      claimTxHash: tx.txHash,
    };
    this.vaults.set(vaultId, updated);
    this.persist();
    return updated;
  }

  /**
   * After the claim deadline, the depositor may reclaim unclaimed funds.
   * Hub-gated; spend uses the depositor wallet as the signing party.
   */
  async reclaimVault(
    vaultId: string,
    depositor: string,
    ctx: CovenantWalletContext,
  ): Promise<CovenantVault> {
    requireCovenantContext(ctx);
    this.reload();

    const raw = this.vaults.get(vaultId);
    if (!raw) throw new Error('Vault not found');
    let vault = this.normalizeStoredVault(raw);
    if (vault.status !== 'locked') throw new Error('Vault is no longer locked');
    if (normalizeAddr(vault.depositor) !== normalizeAddr(depositor)) {
      throw new Error('Only the creator can reclaim this vault');
    }
    if (vault.kind !== 'timelock' || !vault.deadlineAt) {
      throw new Error('Reclaim is only available for timelock vaults with a deadline');
    }
    if (Date.now() < vault.deadlineAt) {
      throw new Error('Claim deadline has not passed yet');
    }
    if (!vault.utxo?.txId && vault.lockTxHash) {
      const utxo = { txId: vault.lockTxHash, index: 0 };
      vault = { ...vault, utxo };
      this.vaults.set(vaultId, vault);
      this.persist();
    }
    if (!vault.utxo) {
      throw new Error(
        'Vault is missing on-chain UTXO reference. Create a new lock to reclaim on L1.',
      );
    }

    const compiled = await loadKaspaComCompiledContract('lockbox');
    const functionName = resolveSpendFunctionName(compiled, 'claim');

    const tx = await executeCovenantSpend(ctx, {
      template: 'lockbox',
      networkId: covenantNetworkIdFromContext(ctx),
      functionName,
      spendOutpoint: { txid: vault.utxo.txId, vout: vault.utxo.index },
      inputAmountSompi: vault.amountSompi,
      outputs: [{ address: depositor.trim(), amountSompi: vault.amountSompi }],
      params: {
        action: 'reclaim',
        vaultId,
        beneficiary: depositor.trim(),
      },
    });

    const updated: CovenantVault = {
      ...vault,
      status: 'reclaimed',
      claimedAt: Date.now(),
      claimTxHash: tx.txHash,
    };
    this.vaults.set(vaultId, updated);
    this.persist();
    return updated;
  }

  /** Persist Hub claim-fee tx so fee-first retries do not double-charge. */
  async setClaimFeeTxHash(vaultId: string, feeTxHash: string): Promise<void> {
    this.reload();
    const vault = this.vaults.get(vaultId);
    if (!vault) throw new Error('Vault not found');
    this.vaults.set(vaultId, { ...vault, claimFeeTxHash: feeTxHash });
    this.persist();
  }

  async getVault(vaultId: string): Promise<CovenantVault | null> {
    this.reload();
    const vault = this.vaults.get(vaultId);
    return vault ? this.normalizeStoredVault(vault) : null;
  }

  async listVaults(filter?: VaultListFilter): Promise<CovenantVault[]> {
    this.reload();
    let list = Array.from(this.vaults.values())
      .map((v) => this.normalizeStoredVault(v))
      .sort((a, b) => b.createdAt - a.createdAt);
    if (filter?.status) list = list.filter((v) => v.status === filter.status);
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

let instance: SilverscriptCovenantRuntime | null = null;

export function getSilverscriptCovenantRuntime(): SilverscriptCovenantRuntime {
  if (!instance) instance = new SilverscriptCovenantRuntime();
  return instance;
}
