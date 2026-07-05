/**
 * React Hook for KREX Balance
 * Fetches KREX token balances from both L1 and L2 wallets
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount, useChainId } from 'wagmi';
import { queryKREXBalance, type KREXBalanceResult } from '@/lib/krex/balance-query';
import { getKREXTierFromBalance } from '@/lib/krex/tier';
import type { KREXTier } from '@/lib/rewards/types';

export interface UseKREXBalanceReturn {
  balance: number;
  l1Balance: number;
  l2Balance: number;
  /** Tier from total (L1 + L2). Use for fee/cost UI. */
  tier: KREXTier;
  /** Tier from this chain's balance only. Use for L2 dApp "You Receive" so it matches on-chain rewards. */
  tierForChain: KREXTier;
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
  const chainId = useChainId();
  
  const l1Address = kaspaState.address;
  const l2Address = evmAddress || null;
  const isWalletConnected = kaspaState.isConnected || isEVMConnected;
  const l1Provider = kaspaState.provider;

  const [balanceData, setBalanceData] = useState<KREXBalanceResult>({
    l1: 0,
    l2: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchKREXBalance = useCallback(async () => {
    // If no wallets connected, reset state
    if (!isWalletConnected || (!l1Address && !l2Address)) {
      setBalanceData({ l1: 0, l2: 0, total: 0 });
      setIsLoading(false);
      setError(null);
      hasLoadedRef.current = false;
      return;
    }

    if (!hasLoadedRef.current) setIsLoading(true);
    setError(null);

    try {
      const result = await queryKREXBalance(l1Address, l2Address, chainId, {
        allowKasWareFallback: l1Provider === 'kasware',
      });
      setBalanceData(result);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error('Error fetching KREX balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch KREX balance');
      // Set zeros on error
      setBalanceData({ l1: 0, l2: 0, total: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [l1Address, l2Address, isWalletConnected, chainId, l1Provider]);

  useEffect(() => {
    fetchKREXBalance();
  }, [fetchKREXBalance]);

  // Tier from total (for fee/cost reductions, status displays)
  const tier = getKREXTierFromBalance(balanceData.total);
  // Tier from current chain only: on L2 the contract uses payer's tKREX on that chain, so use l2 for reward display
  const tierForChain = getKREXTierFromBalance(chainId && (chainId === 38836 || chainId === 38833 || chainId === 167012 || chainId === 202555) ? balanceData.l2 : balanceData.total);

  return {
    balance: balanceData.total,
    l1Balance: balanceData.l1,
    l2Balance: balanceData.l2,
    tier,
    tierForChain,
    isLoading,
    error,
    refetch: fetchKREXBalance,
  };
}
