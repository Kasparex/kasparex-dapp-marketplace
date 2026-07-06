'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getCovenantRuntime,
  getActiveCovenantRuntimeMode,
  importVaultFromCovenantId,
  runKpxCovenantDeployWithFee,
  awardKpxCovenantClaimPoints,
  resolveKpxCovenantDeployPrice,
  type CovenantVault,
  type CovenantVaultKind,
} from '@/lib/covenant';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant/config';
import { DEFAULT_PROGRAMMABLE_NETWORK } from '@/lib/programmable/config';
import { loadMap, saveMap } from '@/lib/covenant/utils';

interface UseCovenantLockboxReturn {
  vaults: CovenantVault[];
  isLoading: boolean;
  error: string | null;
  runtimeMode: string;
  effectiveMode: string;
  refreshVaults: () => Promise<void>;
  createVault: (args: {
    kind: CovenantVaultKind;
    beneficiary: string;
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
    return { provider: provider as KaspaWalletProvider, userAddress: address };
  }, [address, isConnected, provider]);

  const refreshVaults = useCallback(async () => {
    if (!address) {
      setVaults([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await runtime.listVaults({ address, role: 'any' });
      setVaults(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vaults');
    } finally {
      setIsLoading(false);
    }
  }, [address, runtime]);

  useEffect(() => {
    void refreshVaults();
  }, [refreshVaults]);

  const createVault = useCallback(
    async (args: {
      kind: CovenantVaultKind;
      beneficiary: string;
      amountKas: number;
      memo: string;
      unlockAt: Date | null;
    }) => {
      if (args.amountKas <= 0) throw new Error('Amount must be positive');

      const amountSompi = String(Math.round(args.amountKas * 100_000_000));
      const unlockAtMs = args.unlockAt ? args.unlockAt.getTime() : null;

      setIsLoading(true);
      setError(null);
      try {
        const pricing = resolveKpxCovenantDeployPrice('lockbox', krexTier);
        const vault = await runKpxCovenantDeployWithFee({
          template: 'lockbox',
          pricing,
          ctx: walletCtx(),
          create: () =>
            runtime.createVault(
              {
                kind: args.kind,
                depositor: walletCtx().userAddress,
                beneficiary: args.beneficiary,
                amountSompi,
                memo: args.memo,
                unlockAt: unlockAtMs,
              },
              walletCtx(),
            ),
        });
        await refreshVaults();
        return vault;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create vault';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshVaults, runtime, walletCtx, krexTier]
  );

  const claimVault = useCallback(
    async (vaultId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const vault = await runtime.claimVault(vaultId, walletCtx().userAddress, walletCtx());
        awardKpxCovenantClaimPoints({
          walletAddress: walletCtx().userAddress,
          template: 'lockbox',
          instanceId: vaultId,
          krexTier,
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
    [refreshVaults, runtime, walletCtx, krexTier]
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
          DEFAULT_PROGRAMMABLE_NETWORK,
        );
        if (!imported) {
          throw new Error('Covenant not found on KaspaCom indexer or kascov.');
        }

        const existing = Array.from(loadMap<CovenantVault>(COVENANT_LAB_CONFIG.storageKey).values()).find(
          (v) => v.covenantId === imported.covenantId,
        );
        if (existing) return existing;

        const vault: CovenantVault = {
          id: `import_${imported.covenantId.slice(0, 12)}`,
          covenantId: imported.covenantId,
          kind: 'escrow',
          status: imported.status === 'claimed' ? 'claimed' : 'locked',
          depositor: address,
          beneficiary: imported.beneficiary,
          amountSompi: imported.amountSompi,
          memo: imported.templateLabel ? `Imported ${imported.templateLabel}` : 'Imported covenant',
          unlockAt: null,
          createdAt: Date.now(),
          claimedAt: imported.status === 'claimed' ? Date.now() : null,
          lockTxHash: imported.lockTxHash,
          utxo: imported.utxo,
        };

        const stored = loadMap<CovenantVault>(COVENANT_LAB_CONFIG.storageKey);
        stored.set(vault.id, vault);
        saveMap(COVENANT_LAB_CONFIG.storageKey, stored);
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
