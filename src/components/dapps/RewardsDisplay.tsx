/**
 * Rewards Display Component
 * GRID/tGRID only. Auto-refresh balance.
 */

'use client';

import { useMemo } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { TokenIcon } from '@/components/tokens/TokenIcon';
import { GRID_TOKEN_ABI } from '@/lib/contracts/abis';
import { getExplorerUrl } from '@/lib/dapps/deployer';

export interface RewardsDisplayProps {
  gridTokenAddress?: string;
  /** @deprecated LRT removed; use GRID/tGRID only */
  dAppTokenAddress?: string;
  /** @deprecated LRT removed */
  ticker?: string;
  className?: string;
}

export function RewardsDisplay({
  gridTokenAddress,
  className = '',
}: RewardsDisplayProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const formatAddress = (addr: string | null) => {
    if (!addr || !addr.startsWith('0x')) return null;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const gridExplorerUrl = gridTokenAddress ? getExplorerUrl(gridTokenAddress, chainId) : null;

  const { data: gridBalance, refetch: refetchGrid } = useReadContract({
    address: gridTokenAddress as `0x${string}`,
    abi: GRID_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!gridTokenAddress,
      refetchInterval: 60000,
      staleTime: 60_000,
    },
  }) as { data: bigint | undefined; refetch: () => void };

  const formattedGridBalance = useMemo(() => {
    if (!gridBalance) return '0';
    return (Number(gridBalance) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [gridBalance]);

  const hasRewards = useMemo(() => {
    return gridBalance !== undefined && gridBalance !== null && Number(gridBalance) > 0;
  }, [gridBalance]);

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
          onClick={() => refetchGrid()}
          className="text-sm text-[#02abb8] hover:text-[#0199a3] transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {gridTokenAddress && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <TokenIcon ticker="GRID" size={32} />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">GRID / tGRID</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Ecosystem Rewards</p>
                </div>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {formattedGridBalance}
              </p>
            </div>
            {gridExplorerUrl && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Contract:</span>
                <a
                  href={gridExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#02abb8] hover:text-[#0199a3] hover:underline transition-colors"
                  title={gridTokenAddress}
                >
                  {formatAddress(gridTokenAddress)}
                </a>
              </div>
            )}
            <div className="pt-2 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="font-medium mb-1">How to Earn:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Complete on-chain transactions in dApps</li>
                <li>Earn GRID/tGRID automatically per transaction</li>
              </ul>
            </div>
          </div>
        )}

        {!hasRewards && (
          <div className="p-4 text-center text-zinc-600 dark:text-zinc-400 text-sm">
            <p className="mb-2">No rewards yet. Use dApps and complete transactions to earn GRID/tGRID.</p>
          </div>
        )}
      </div>
    </div>
  );
}

