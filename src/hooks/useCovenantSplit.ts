'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getSplitPaymentRuntime,
  getActiveCovenantRuntimeMode,
  runKpxCovenantDeployWithFee,
  awardKpxCovenantClaimPoints,
  resolveKpxCovenantDeployPrice,
  type SplitPayment,
  type SplitRecipientInput,
} from '@/lib/covenant';
import { useKREXBalance } from '@/hooks/useKREXBalance';

interface UseCovenantSplitReturn {
  splits: SplitPayment[];
  isLoading: boolean;
  error: string | null;
  runtimeMode: string;
  effectiveMode: string;
  refreshSplits: () => Promise<void>;
  createSplit: (args: {
    totalKas: number;
    memo: string;
    recipients: SplitRecipientInput[];
  }) => Promise<SplitPayment>;
  claimShare: (splitId: string, recipientId: string) => Promise<SplitPayment>;
}

export function useCovenantSplit(): UseCovenantSplitReturn {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address;
  const isConnected = kaspaState.isConnected;
  const provider = kaspaState.provider;

  const [splits, setSplits] = useState<SplitPayment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runtime = getSplitPaymentRuntime();
  const { tier: krexTier } = useKREXBalance();

  const walletCtx = useCallback(() => {
    if (!isConnected || !address || !provider) {
      throw new Error('Connect your Kaspa wallet first');
    }
    return { provider: provider as KaspaWalletProvider, userAddress: address };
  }, [address, isConnected, provider]);

  const refreshSplits = useCallback(async () => {
    if (!address) {
      setSplits([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await runtime.listSplits({ address, role: 'any' });
      setSplits(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load splits');
    } finally {
      setIsLoading(false);
    }
  }, [address, runtime]);

  useEffect(() => {
    void refreshSplits();
  }, [refreshSplits]);

  const createSplit = useCallback(
    async (args: { totalKas: number; memo: string; recipients: SplitRecipientInput[] }) => {
      if (args.totalKas <= 0) throw new Error('Total must be positive');

      const totalSompi = String(Math.round(args.totalKas * 100_000_000));

      setIsLoading(true);
      setError(null);
      try {
        const pricing = resolveKpxCovenantDeployPrice('split', krexTier, {
          premiumSlotCount: args.recipients.length,
        });
        const split = await runKpxCovenantDeployWithFee({
          template: 'split',
          pricing,
          ctx: walletCtx(),
          create: () =>
            runtime.createSplit(
              {
                depositor: walletCtx().userAddress,
                totalSompi,
                memo: args.memo,
                recipients: args.recipients,
              },
              walletCtx(),
            ),
        });
        await refreshSplits();
        return split;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create split';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshSplits, runtime, walletCtx, krexTier]
  );

  const claimShare = useCallback(
    async (splitId: string, recipientId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const split = await runtime.claimShare(
          splitId,
          recipientId,
          walletCtx().userAddress,
          walletCtx()
        );
        awardKpxCovenantClaimPoints({
          walletAddress: walletCtx().userAddress,
          template: 'split',
          instanceId: `${splitId}:${recipientId}`,
          krexTier,
        });
        await refreshSplits();
        return split;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to claim share';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshSplits, runtime, walletCtx, krexTier]
  );

  return {
    splits,
    isLoading,
    error,
    runtimeMode: getActiveCovenantRuntimeMode(),
    effectiveMode: runtime.effectiveMode,
    refreshSplits,
    createSplit,
    claimShare,
  };
}
