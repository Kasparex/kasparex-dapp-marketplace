'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import {
  COVENANT_LAB_CONFIG,
  buildSplitCommitNote,
  getSplitPaymentRuntime,
  type SplitPayment,
  type SplitRecipientInput,
} from '@/lib/covenant';

interface UseCovenantSplitReturn {
  splits: SplitPayment[];
  isLoading: boolean;
  error: string | null;
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
      if (!isConnected || !address || !provider) {
        throw new Error('Connect your Kaspa wallet first');
      }
      if (args.totalKas <= 0) throw new Error('Total must be positive');

      const totalSompi = String(Math.round(args.totalKas * 100_000_000));
      const draftId = `draft_${Date.now()}`;
      let lockTxHash: string | undefined;

      const treasury = COVENANT_LAB_CONFIG.treasuryAddress;
      if (treasury) {
        const note = buildSplitCommitNote({
          splitId: draftId,
          totalSompi,
          recipients: args.recipients,
        });
        const sent = await sendKaspaTransaction(provider as KaspaWalletProvider, {
          to: treasury,
          amount: totalSompi,
          note,
        });
        if (sent.status === 'failed' || !sent.txHash) {
          throw new Error(sent.error || 'KAS split payment failed');
        }
        lockTxHash = extractKaspaTransactionId(sent.txHash) ?? sent.txHash;

        void fetch('/api/rewards/l1/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: lockTxHash,
            userAddress: address,
            dappId: 'covenant-split',
            actionType: 'covenant-split',
            actionValue: args.totalKas,
            network: 'L1',
          }),
        }).catch(() => {});
      }

      setIsLoading(true);
      setError(null);
      try {
        const split = await runtime.createSplit({
          depositor: address,
          totalSompi,
          memo: args.memo,
          recipients: args.recipients,
          lockTxHash,
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
    [address, isConnected, provider, refreshSplits, runtime]
  );

  const claimShare = useCallback(
    async (splitId: string, recipientId: string) => {
      if (!isConnected || !address) {
        throw new Error('Connect your Kaspa wallet first');
      }
      setIsLoading(true);
      setError(null);
      try {
        const split = await runtime.claimShare(splitId, recipientId, address);
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
    [address, isConnected, refreshSplits, runtime]
  );

  return {
    splits,
    isLoading,
    error,
    refreshSplits,
    createSplit,
    claimShare,
  };
}
