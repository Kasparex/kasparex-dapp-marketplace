/**
 * Hub Points rewards after successful dApp transactions.
 * Token rewards (GRID/KREX) are claimed separately on the Rewards page.
 */

'use client';

import { useState, useCallback } from 'react';
import { DApp } from '@/lib/dapps';
import { useKREXBalance } from './useKREXBalance';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKaspaWallet } from '@/lib/kaspa/context';

export interface DistributeRewardOptions {
  dapp: DApp;
  actionId: string;
  actionType: string;
  baseActionValue: number;
  txHash: string;
  dAppContractAddress?: string;
}

export interface UseAutomatedRewardsReturn {
  distributeRewardAfterTransaction: (
    options: DistributeRewardOptions,
  ) => Promise<{ success: boolean; hubPointsEarned?: number; error?: string }>;
  isDistributing: boolean;
  error: string | null;
}

export function useAutomatedRewards(): UseAutomatedRewardsReturn {
  const { state: kaspaState } = useKaspaWallet();
  const { balance: krexBalance, tier } = useKREXBalance();
  const [isDistributing, setIsDistributing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const distributeRewardAfterTransaction = useCallback(
    async (
      options: DistributeRewardOptions,
    ): Promise<{ success: boolean; hubPointsEarned?: number; error?: string }> => {
      setIsDistributing(true);
      setError(null);

      try {
        const wallet = kaspaState.address?.trim();
        if (!wallet) {
          return { success: false, error: 'Connect your Kaspa L1 wallet to earn Hub Points' };
        }

        const hubPointsEarned = awardDAppHubPoints({
          walletRaw: wallet,
          dapp: options.dapp,
          actionId: options.actionId,
          txHash: options.txHash,
          krexTier: tier,
          krexBalance: krexBalance ?? 0,
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dapp-transaction-success'));
        }

        return { success: true, hubPointsEarned };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsDistributing(false);
      }
    },
    [kaspaState.address, krexBalance, tier],
  );

  return {
    distributeRewardAfterTransaction,
    isDistributing,
    error,
  };
}
