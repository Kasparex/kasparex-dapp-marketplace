import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
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
import { DEFAULT_PROGRAMMABLE_NETWORK } from '@/lib/programmable/config';
import { normalizeAddr, randomHex, randomId } from './utils';
import { loadMap, saveMap } from './utils';

class SilverscriptCovenantRuntime implements CovenantRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;

  private vaults = loadMap<CovenantVault>(COVENANT_LAB_CONFIG.storageKey);

  private persist(): void {
    saveMap(COVENANT_LAB_CONFIG.storageKey, this.vaults);
  }

  async createVault(
    params: CreateVaultParams,
    ctx: CovenantWalletContext
  ): Promise<CovenantVault> {
    requireCovenantContext(ctx);

    const amount = BigInt(params.amountSompi);
    const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
    if (amount < min) throw new Error(`Minimum lock is ${Number(min) / 1e8} KAS`);
    if (!params.beneficiary?.trim()) throw new Error('Beneficiary address is required');
    if (params.kind === 'timelock') {
      if (!params.unlockAt || params.unlockAt <= Date.now()) {
        throw new Error('Timelock requires a future unlock time');
      }
    }
    if (params.memo.length > COVENANT_LAB_CONFIG.maxMemoLength) {
      throw new Error(`Memo max ${COVENANT_LAB_CONFIG.maxMemoLength} characters`);
    }

    const unlockSeconds =
      params.kind === 'timelock' && params.unlockAt
        ? Math.floor(params.unlockAt / 1000)
        : 0;

    const networkId = DEFAULT_PROGRAMMABLE_NETWORK;
    const tx = await executeCovenantDeploy(ctx, {
      template: 'lockbox',
      amountSompi: params.amountSompi,
      networkId,
      payloadTemplate: KPX_COVENANT_PAYLOAD_TEMPLATES.lockbox,
      payloadArgs: [
        { name: 'beneficiary', type: 'address', value: params.beneficiary.trim() },
        { name: 'depositor', type: 'address', value: params.depositor.trim() },
        { name: 'unlockTimeMs', type: 'u64', value: String(unlockSeconds * 1000) },
        { name: 'kind', type: 'string', value: params.kind },
      ],
      payloadMeta: params.memo.trim() ? { label: params.memo.trim().slice(0, 80) } : undefined,
      params: {
        kind: params.kind,
        beneficiary: params.beneficiary,
        depositor: params.depositor,
        unlockTime: unlockSeconds,
        memo: params.memo,
      },
    });

    const id = randomId('vault');
    const vault: CovenantVault = {
      id,
      covenantId: tx.covenantId ?? `pending_${randomHex(16)}`,
      kind: params.kind,
      status: 'locked',
      depositor: params.depositor,
      beneficiary: params.beneficiary,
      amountSompi: params.amountSompi,
      memo: params.memo.trim(),
      unlockAt: params.kind === 'timelock' ? params.unlockAt : null,
      createdAt: Date.now(),
      claimedAt: null,
      lockTxHash: tx.txHash,
      utxo: tx.outpoint ?? { txId: tx.txHash, index: 0 },
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
    if (!vault.utxo) {
      throw new Error('Vault is missing on-chain UTXO reference');
    }

    const compiled = await loadKaspaComCompiledContract('lockbox');
    const functionName = resolveSpendFunctionName(compiled, 'claim');

    const tx = await executeCovenantSpend(ctx, {
      template: 'lockbox',
      networkId: DEFAULT_PROGRAMMABLE_NETWORK,
      functionName,
      spendOutpoint: { txid: vault.utxo.txId, vout: vault.utxo.index },
      inputAmountSompi: vault.amountSompi,
      outputs: [{ address: vault.beneficiary, amountSompi: vault.amountSompi }],
      params: {
        action: 'claim',
        vaultId,
        beneficiary: vault.beneficiary,
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

  async getVault(vaultId: string): Promise<CovenantVault | null> {
    return this.vaults.get(vaultId) ?? null;
  }

  async listVaults(filter?: VaultListFilter): Promise<CovenantVault[]> {
    let list = Array.from(this.vaults.values()).sort((a, b) => b.createdAt - a.createdAt);
    if (filter?.status) list = list.filter((v) => v.status === filter.status);
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

let instance: SilverscriptCovenantRuntime | null = null;

export function getSilverscriptCovenantRuntime(): SilverscriptCovenantRuntime {
  if (!instance) instance = new SilverscriptCovenantRuntime();
  return instance;
}
