'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getCovenantRuntime,
  getActiveCovenantRuntimeMode,
  type CovenantVault,
  type CovenantVaultKind,
} from '@/lib/covenant';

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
        const vault = await runtime.createVault(
          {
            kind: args.kind,
            depositor: walletCtx().userAddress,
            beneficiary: args.beneficiary,
            amountSompi,
            memo: args.memo,
            unlockAt: unlockAtMs,
          },
          walletCtx()
        );
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
    [refreshVaults, runtime, walletCtx]
  );

  const claimVault = useCallback(
    async (vaultId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const vault = await runtime.claimVault(vaultId, walletCtx().userAddress, walletCtx());
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
    [refreshVaults, runtime, walletCtx]
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
  };
}
