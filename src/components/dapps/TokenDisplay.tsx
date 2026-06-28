/**
 * Token Display Component
 * Shows dApp token info with allocation breakdown (icon-based)
 */

'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { TokenIcon } from '@/components/tokens/TokenIcon';
import { DAPP_TOKEN_ABI } from '@/lib/contracts/abis';
import { useBalanceVisibility, maskValue } from '@/hooks/useBalanceVisibility';

export interface TokenDisplayProps {
  tokenAddress: string;
  ticker: string;
  totalSupply: string;
  dAppName: string;
  className?: string;
}

export function TokenDisplay({
  tokenAddress,
  ticker,
  totalSupply,
  dAppName,
  className = '',
}: TokenDisplayProps) {
  const { address, isConnected } = useAccount();
  const { isVisible: isBalanceVisible } = useBalanceVisibility();

  // Get token balance
  const { data: balance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: DAPP_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    },
  }) as { data: bigint | undefined };

  // Get remaining supply
  const { data: remainingSupply } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: DAPP_TOKEN_ABI,
    functionName: 'getRemainingSupply',
    query: {
      enabled: !!tokenAddress,
    },
  }) as { data: bigint | undefined };

  const allocationBreakdown = useMemo(() => {
    return {
      useToMint: '80%',
      liquidity: '10%',
      treasury: '5%',
      dev: '3%',
      airdrops: '2%',
    };
  }, []);

  const formattedBalance = useMemo(() => {
    if (!balance) return '0';
    const num = Number(balance) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [balance]);

  const formattedTotalSupply = useMemo(() => {
    const num = Number(totalSupply) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, [totalSupply]);

  const formattedRemaining = useMemo(() => {
    if (!remainingSupply) return '0';
    const num = Number(remainingSupply) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }, [remainingSupply]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <TokenIcon ticker={ticker} size={48} />
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {ticker} Token
          </h3>
          <p className="kx-body">
            {dAppName} Token
          </p>
        </div>
      </div>

      {isConnected && balance !== undefined && balance !== null && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <p className="kx-body mb-1">Your Balance</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {maskValue(formattedBalance, isBalanceVisible)} {ticker}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Token Allocation
        </h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Use-to-Mint</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{allocationBreakdown.useToMint}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Liquidity Reserve</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{allocationBreakdown.liquidity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Treasury</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{allocationBreakdown.treasury}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Dev/Maintenance</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{allocationBreakdown.dev}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Airdrops & Bonuses</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{allocationBreakdown.airdrops}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-600 dark:text-zinc-400">Total Supply</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{formattedTotalSupply} {ticker}</span>
        </div>
        {remainingSupply !== undefined && remainingSupply !== null && (
          <div className="flex justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">Remaining</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{formattedRemaining} {ticker}</span>
          </div>
        )}
      </div>
    </div>
  );
}

