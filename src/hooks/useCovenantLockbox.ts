'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import {
  COVENANT_LAB_CONFIG,
  buildLockboxCommitNote,
  getCovenantRuntime,
  type CovenantVault,
  type CovenantVaultKind,
} from '@/lib/covenant';

interface UseCovenantLockboxReturn {
  vaults: CovenantVault[];
  isLoading: boolean;
  error: string | null;
  runtimeMode: string;
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
      if (!isConnected || !address || !provider) {
        throw new Error('Connect your Kaspa wallet first');
      }
      if (args.amountKas <= 0) throw new Error('Amount must be positive');

      const amountSompi = String(Math.round(args.amountKas * 100_000_000));
      const unlockAtMs = args.unlockAt ? args.unlockAt.getTime() : null;

      const draftId = `draft_${Date.now()}`;
      let lockTxHash: string | undefined;

      const treasury = COVENANT_LAB_CONFIG.treasuryAddress;
      if (treasury) {
        const note = buildLockboxCommitNote({
          vaultId: draftId,
          kind: args.kind,
          beneficiary: args.beneficiary,
          amountSompi,
        });
        const sent = await sendKaspaTransaction(provider as KaspaWalletProvider, {
          to: treasury,
          amount: amountSompi,
          note,
        });
        if (sent.status === 'failed' || !sent.txHash) {
          throw new Error(sent.error || 'KAS lock payment failed');
        }
        lockTxHash = extractKaspaTransactionId(sent.txHash) ?? sent.txHash;

        void fetch('/api/rewards/l1/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: lockTxHash,
            userAddress: address,
            dappId: 'covenant-lab',
            actionType: 'covenant-lock',
            actionValue: args.amountKas,
            network: 'L1',
          }),
        }).catch(() => {});
      }

      setIsLoading(true);
      setError(null);
      try {
        const vault = await runtime.createVault({
          kind: args.kind,
          depositor: address,
          beneficiary: args.beneficiary,
          amountSompi,
          memo: args.memo,
          unlockAt: unlockAtMs,
          lockTxHash,
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
    [address, isConnected, provider, refreshVaults, runtime]
  );

  const claimVault = useCallback(
    async (vaultId: string) => {
      if (!isConnected || !address) {
        throw new Error('Connect your Kaspa wallet first');
      }
      setIsLoading(true);
      setError(null);
      try {
        const vault = await runtime.claimVault(vaultId, address);
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
    [address, isConnected, refreshVaults, runtime]
  );

  return {
    vaults,
    isLoading,
    error,
    runtimeMode: runtime.mode,
    refreshVaults,
    createVault,
    claimVault,
  };
}
