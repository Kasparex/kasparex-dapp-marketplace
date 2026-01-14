/**
 * React Hook for KREX Balance
 * Fetches KREX token balances from both L1 and L2 wallets
 */

import { useState, useEffect, useCallback } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { queryKREXBalance, type KREXBalanceResult } from '@/lib/krex/balance-query';
import { getKREXTierFromBalance } from '@/lib/krex/tier';
import type { KREXTier } from '@/lib/rewards/types';

export interface UseKREXBalanceReturn {
  balance: number;
  l1Balance: number;
  l2Balance: number;
  tier: KREXTier;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and compute KREX balance for connected wallets
 */
export function useKREXBalance(): UseKREXBalanceReturn {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  
  const l1Address = kaspaState.address;
  const l2Address = evmAddress || null;
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;

  const [balanceData, setBalanceData] = useState<KREXBalanceResult>({
    l1: 0,
    l2: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKREXBalance = useCallback(async () => {
    // If no wallets connected, reset state
    if (!isWalletConnected || (!l1Address && !l2Address)) {
      setBalanceData({ l1: 0, l2: 0, total: 0 });
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryKREXBalance(l1Address, l2Address);
      setBalanceData(result);
    } catch (err) {
      console.error('Error fetching KREX balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KREX balance');
      // Set zeros on error
      setBalanceData({ l1: 0, l2: 0, total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [l1Address, l2Address, isWalletConnected]);

  useEffect(() => {
    fetchKREXBalance();
  }, [fetchKREXBalance]);

  // Calculate tier from total balance
  const tier = getKREXTierFromBalance(balanceData.total);

  return {
    balance: balanceData.total,
    l1Balance: balanceData.l1,
    l2Balance: balanceData.l2,
    tier,
    isLoading,
    error,
    refetch: fetchKREXBalance,
  };
}
