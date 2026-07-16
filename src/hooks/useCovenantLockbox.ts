'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getCovenantRuntime,
  getActiveCovenantRuntimeMode,
  importVaultFromCovenantId,
  runKpxCovenantDeployWithFee,
  runKpxCovenantClaimWithFee,
  resolveKpxCovenantDeployPrice,
  resolveKpxCovenantClaimPrice,
  type CovenantVault,
  type CovenantVaultKind,
} from '@/lib/covenant';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { resolveCovenantNetworkId } from '@/lib/programmable/config';
import {
  loadL1LockboxVaults,
  purgeSimulatedLockboxVaults,
  saveL1LockboxVaults,
  setL1LockboxClaimFeeTxHash,
} from '@/lib/covenant/lockbox-storage';
import { normalizeCovenantClaimers, normalizeCovenantMemo } from '@/lib/covenant/participants';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant/config';
import { allocateBps, randomId } from '@/lib/covenant/utils';

export type LockboxRecipientInput = {
  address: string;
  /** Basis points (10000 = 100%). */
  shareBps: number;
};

interface UseCovenantLockboxReturn {
  vaults: CovenantVault[];
  isLoading: boolean;
  error: string | null;
  runtimeMode: string;
  effectiveMode: string;
  refreshVaults: () => Promise<void>;
  createVault: (args: {
    kind: CovenantVaultKind;
    recipients: LockboxRecipientInput[];
    amountKas: number;
    memo: string;
    unlockAt: Date | null;
  }) => Promise<CovenantVault>;
  claimVault: (vaultId: string) => Promise<CovenantVault>;
  importByCovenantId: (covenantId: string) => Promise<CovenantVault | null>;
}

function validateLockboxRecipients(recipients: LockboxRecipientInput[]): LockboxRecipientInput[] {
  if (recipients.length === 0) {
    throw new Error('At least one claimer address is required');
  }
  if (recipients.length > 8) {
    throw new Error('Maximum 8 claimers');
  }

  const claimers = normalizeCovenantClaimers(recipients.map((r) => r.address));
  if (claimers.length !== recipients.length) {
    throw new Error('Each claimer needs a unique address');
  }

  if (recipients.length === 1) {
    return [{ address: claimers[0], shareBps: 10000 }];
  }

  let bpsSum = 0;
  const out: LockboxRecipientInput[] = [];
  for (let i = 0; i < recipients.length; i++) {
    const shareBps = Math.round(recipients[i].shareBps);
    if (shareBps <= 0) throw new Error('Each share must be greater than 0%');
    bpsSum += shareBps;
    out.push({ address: claimers[i], shareBps });
  }
  if (bpsSum !== 10000) {
    throw new Error('Shares must total 100%');
  }
  return out;
}

export function useCovenantLockbox(): UseCovenantLockboxReturn {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address;
  const isConnected = kaspaState.isConnected;
  const provider = kaspaState.provider;

  const [vaults, setVaults] = useState<CovenantVault[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runtime = getCovenantRuntime();
  const { tier: krexTier } = useKREXBalance();

  const walletCtx = useCallback(() => {
    if (!isConnected || !address || !provider) {
      throw new Error('Connect your Kaspa wallet first');
    }
    return {
      provider: provider as KaspaWalletProvider,
      userAddress: address,
      networkId: resolveCovenantNetworkId({ address }),
    };
  }, [address, isConnected, provider]);

  const refreshVaults = useCallback(async () => {
    if (!address) {
      setVaults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      purgeSimulatedLockboxVaults();
      const list = await runtime.listVaults({ address, role: 'any' });
      setVaults(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vaults');
    } finally {
      setIsLoading(false);
    }
  }, [address, runtime]);

  useEffect(() => {
    purgeSimulatedLockboxVaults();
    void refreshVaults();
  }, [refreshVaults]);

  const createVault = useCallback(
    async (args: {
      kind: CovenantVaultKind;
      recipients: LockboxRecipientInput[];
      amountKas: number;
      memo: string;
      unlockAt: Date | null;
    }) => {
      if (args.amountKas <= 0) throw new Error('Amount must be positive');
      if (args.kind === 'timelock' && !args.unlockAt) {
        throw new Error('Timelock requires an unlock date');
      }

      const recipients = validateLockboxRecipients(args.recipients);
      const memo = normalizeCovenantMemo(args.memo, COVENANT_LAB_CONFIG.maxMemoLength);
      const totalSompi = BigInt(Math.round(args.amountKas * 100_000_000));
      const unlockAtMs = args.unlockAt ? args.unlockAt.getTime() : null;
      const amounts = allocateBps(
        totalSompi,
        recipients.map((r) => r.shareBps),
      );
      const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
      for (const amountSompi of amounts) {
        if (BigInt(amountSompi) < min) {
          throw new Error(
            `Each claimer share must be at least ${Number(min) / 1e8} KAS (raise the total or adjust %)`,
          );
        }
      }

      const groupId = recipients.length > 1 ? randomId('lbg') : undefined;

      setIsLoading(true);
      setError(null);
      try {
        const pricing = resolveKpxCovenantDeployPrice('lockbox', krexTier, {
          premiumSlotCount: recipients.length,
        });
        const ctx = walletCtx();
        const created = await runKpxCovenantDeployWithFee({
          template: 'lockbox',
          pricing,
          ctx,
          create: async () => {
            const vaultsCreated: CovenantVault[] = [];
            for (let i = 0; i < recipients.length; i++) {
              const vault = await runtime.createVault(
                {
                  kind: args.kind,
                  depositor: ctx.userAddress,
                  beneficiary: recipients[i].address,
                  beneficiaries: [recipients[i].address],
                  amountSompi: amounts[i],
                  shareBps: recipients[i].shareBps,
                  groupId,
                  memo,
                  unlockAt: unlockAtMs,
                },
                ctx,
              );
              vaultsCreated.push(vault);
            }
            return vaultsCreated[0];
          },
        });

        // Re-load all siblings and ensure memo/share fields stick.
        const stored = loadL1LockboxVaults();
        const siblings = Array.from(stored.values()).filter((v) =>
          groupId ? v.groupId === groupId : v.id === created.id,
        );
        for (const vault of siblings) {
          const merged: CovenantVault = {
            ...vault,
            memo: vault.memo?.trim() || memo,
          };
          stored.set(merged.id, merged);
        }
        saveL1LockboxVaults(stored);

        const primary =
          siblings.find((v) => v.id === created.id) ??
          ({ ...created, memo: created.memo?.trim() || memo } as CovenantVault);
        setVaults((prev) => {
          const without = prev.filter((v) => !siblings.some((s) => s.id === v.id));
          return [...siblings.map((v) => ({ ...v, memo: v.memo?.trim() || memo })), ...without];
        });
        await refreshVaults();
        return primary;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create vault';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshVaults, runtime, walletCtx, krexTier],
  );

  const claimVault = useCallback(
    async (vaultId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const pricing = resolveKpxCovenantClaimPrice('lockbox', krexTier);
        const existing = (await runtime.getVault(vaultId))?.claimFeeTxHash;
        const vault = await runKpxCovenantClaimWithFee({
          template: 'lockbox',
          pricing,
          ctx: walletCtx(),
          instanceId: vaultId,
          existingFeeTxHash: existing,
          onFeePaid: (feeTxHash) => {
            setL1LockboxClaimFeeTxHash(vaultId, feeTxHash);
          },
          claim: () => runtime.claimVault(vaultId, walletCtx().userAddress, walletCtx()),
        });
        await refreshVaults();
        return vault;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to claim vault';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshVaults, runtime, walletCtx, krexTier],
  );

  const importByCovenantId = useCallback(
    async (covenantId: string) => {
      if (!address) throw new Error('Connect your Kaspa wallet first');
      setIsLoading(true);
      setError(null);
      try {
        const imported = await importVaultFromCovenantId(
          covenantId,
          address,
          resolveCovenantNetworkId({ address }),
        );
        if (!imported) {
          throw new Error('Covenant not found on KaspaCom indexer or kascov.');
        }

        const stored = loadL1LockboxVaults();
        const existing = Array.from(stored.values()).find(
          (v) => v.covenantId === imported.covenantId,
        );
        if (existing) {
          await refreshVaults();
          return existing;
        }

        const memo = normalizeCovenantMemo(
          imported.memo ||
            (imported.templateLabel ? `Imported ${imported.templateLabel}` : 'Imported covenant'),
          COVENANT_LAB_CONFIG.maxMemoLength,
        );
        const vault: CovenantVault = {
          id: `import_${imported.covenantId.slice(0, 12)}`,
          covenantId: imported.covenantId,
          kind: imported.kind,
          status: imported.status === 'claimed' ? 'claimed' : 'locked',
          depositor: address,
          beneficiary: imported.beneficiary,
          beneficiaries: imported.beneficiary ? [imported.beneficiary] : [],
          amountSompi: imported.amountSompi,
          memo,
          unlockAt: imported.unlockAt,
          createdAt: Date.now(),
          claimedAt: imported.status === 'claimed' ? Date.now() : null,
          lockTxHash: imported.lockTxHash,
          utxo: imported.utxo,
          origin: 'l1',
        };

        stored.set(vault.id, vault);
        saveL1LockboxVaults(stored);
        await refreshVaults();
        return vault;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Import failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, refreshVaults],
  );

  return {
    vaults,
    isLoading,
    error,
    runtimeMode: getActiveCovenantRuntimeMode(),
    effectiveMode: runtime.effectiveMode,
    refreshVaults,
    createVault,
    claimVault,
    importByCovenantId,
  };
}
