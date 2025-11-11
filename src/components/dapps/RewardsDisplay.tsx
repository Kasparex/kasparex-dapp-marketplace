/**
 * Rewards Display Component
 * Auto-refresh GRID and dApp token rewards, batch claim option
 */

'use client';

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TokenIcon } from '@/components/tokens/TokenIcon';
import { GRID_TOKEN_ABI, DAPP_TOKEN_ABI } from '@/lib/contracts/abis';

export interface RewardsDisplayProps {
  gridTokenAddress?: string;
  dAppTokenAddress?: string;
  ticker?: string;
  className?: string;
}

export function RewardsDisplay({
  gridTokenAddress,
  dAppTokenAddress,
  ticker,
  className = '',
}: RewardsDisplayProps) {
  const { address, isConnected } = useAccount();
  const [claiming, setClaiming] = useState(false);

  // Get GRID balance
  const { data: gridBalance, refetch: refetchGrid } = useReadContract({
    address: gridTokenAddress as `0x${string}`,
    abi: GRID_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!gridTokenAddress,
      refetchInterval: 30000, // Auto-refresh every 30 seconds
    },
  });

  // Get dApp token balance
  const { data: dAppTokenBalance, refetch: refetchDAppToken } = useReadContract({
    address: dAppTokenAddress as `0x${string}`,
    abi: DAPP_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!dAppTokenAddress,
      refetchInterval: 30000,
    },
  });

  const formattedGridBalance = useMemo(() => {
    if (!gridBalance) return '0';
    const num = Number(gridBalance) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [gridBalance]);

  const formattedDAppTokenBalance = useMemo(() => {
    if (!dAppTokenBalance) return '0';
    const num = Number(dAppTokenBalance) / 1e18;
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [dAppTokenBalance]);

  const hasRewards = useMemo(() => {
    return (gridBalance && Number(gridBalance) > 0) || 
           (dAppTokenBalance && Number(dAppTokenBalance) > 0);
  }, [gridBalance, dAppTokenBalance]);

  if (!isConnected || !address) {
    return (
      <div className={`p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 ${className}`}>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect wallet to view rewards
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Your Rewards
        </h3>
        <button
          onClick={() => {
            refetchGrid();
            refetchDAppToken();
          }}
          className="text-sm text-[#02abb8] hover:text-[#0199a3] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {gridTokenAddress && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenIcon ticker="GRID" size={32} />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">GRID</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Ecosystem Rewards</p>
                </div>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formattedGridBalance}
              </p>
            </div>
          </div>
        )}

        {dAppTokenAddress && ticker && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenIcon ticker={ticker} size={32} />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ticker}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">dApp Rewards</p>
                </div>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formattedDAppTokenBalance}
              </p>
            </div>
          </div>
        )}

        {!hasRewards && (
          <div className="p-4 text-center text-zinc-600 dark:text-zinc-400 text-sm">
            No rewards yet. Use dApps to earn tokens!
          </div>
        )}
      </div>
    </div>
  );
}

