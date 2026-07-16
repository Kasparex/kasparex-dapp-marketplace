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

interface UseCovenantLockboxReturn {
  vaults: CovenantVault[];
  isLoading: boolean;
  error: string | null;
  runtimeMode: string;
  effectiveMode: string;
  refreshVaults: () => Promise<void>;
  createVault: (args: {
    kind: CovenantVaultKind;
    beneficiaries: string[];
    amountKas: number;
    memo: string;
    unlockAt: Date | null;
  }) => Promise<CovenantVault>;
  claimVault: (vaultId: string) => Promise<CovenantVault>;
  importByCovenantId: (covenantId: string) => Promise<CovenantVault | null>;
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
      beneficiaries: string[];
      amountKas: number;
      memo: string;
      unlockAt: Date | null;
    }) => {
      if (args.amountKas <= 0) throw new Error('Amount must be positive');
      if (args.kind === 'timelock' && !args.unlockAt) {
        throw new Error('Timelock requires an unlock date');
      }

      const claimers = normalizeCovenantClaimers(args.beneficiaries);
      const memo = normalizeCovenantMemo(args.memo, COVENANT_LAB_CONFIG.maxMemoLength);
      const amountSompi = String(Math.round(args.amountKas * 100_000_000));
      const unlockAtMs = args.unlockAt ? args.unlockAt.getTime() : null;

      setIsLoading(true);
      setError(null);
      try {
        const pricing = resolveKpxCovenantDeployPrice('lockbox', krexTier, {
          premiumSlotCount: claimers.length,
        });
        const vault = await runKpxCovenantDeployWithFee({
          template: 'lockbox',
          pricing,
          ctx: walletCtx(),
          create: () =>
            runtime.createVault(
              {
                kind: args.kind,
                depositor: walletCtx().userAddress,
                beneficiary: claimers[0],
                beneficiaries: claimers,
                amountSompi,
                memo,
                unlockAt: unlockAtMs,
              },
              walletCtx(),
            ),
        });
        // Ensure memo/claimers survive even if a later refresh races.
        const stored = loadL1LockboxVaults();
        const merged: CovenantVault = {
          ...vault,
          memo: vault.memo?.trim() || memo,
          beneficiaries: vault.beneficiaries?.length ? vault.beneficiaries : claimers,
          beneficiary: vault.beneficiary || claimers[0],
        };
        stored.set(merged.id, merged);
        saveL1LockboxVaults(stored);
        setVaults((prev) => [merged, ...prev.filter((v) => v.id !== merged.id)]);
        await refreshVaults();
        return merged;
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
