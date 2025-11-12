/**
 * Rewards Display Component
 * Auto-refresh GRID and dApp token rewards, batch claim option
 */

'use client';

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { TokenIcon } from '@/components/tokens/TokenIcon';
import { GRID_TOKEN_ABI, DAPP_TOKEN_ABI } from '@/lib/contracts/abis';
import { getExplorerUrl } from '@/lib/dapps/deployer';

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
  const chainId = useChainId();
  const [claiming, setClaiming] = useState(false);
  
  // Format addresses for display
  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get explorer URLs
  const gridExplorerUrl = gridTokenAddress ? getExplorerUrl(gridTokenAddress, chainId) : null;
  const dAppTokenExplorerUrl = dAppTokenAddress ? getExplorerUrl(dAppTokenAddress, chainId) : null;

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
  }) as { data: bigint | undefined; refetch: () => void };

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
  }) as { data: bigint | undefined; refetch: () => void };

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
    return (gridBalance !== undefined && gridBalance !== null && Number(gridBalance) > 0) || 
           (dAppTokenBalance !== undefined && dAppTokenBalance !== null && Number(dAppTokenBalance) > 0);
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
            <div className="flex items-center justify-between mb-2">
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
                <li>Interact with any dApp on the platform</li>
                <li>Complete transactions and actions</li>
                <li>Earn GRID tokens through Proof-of-Utility</li>
              </ul>
            </div>
          </div>
        )}

        {dAppTokenAddress && ticker && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
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
            {dAppTokenExplorerUrl && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Contract:</span>
                <a
                  href={dAppTokenExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#02abb8] hover:text-[#0199a3] hover:underline transition-colors"
                  title={dAppTokenAddress}
                >
                  {formatAddress(dAppTokenAddress)}
                </a>
              </div>
            )}
            <div className="pt-2 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="font-medium mb-1">How to Earn:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-1">
                <li>Use this specific dApp&apos;s features</li>
                <li>Complete dApp-specific actions</li>
                <li>Earn {ticker} tokens through interactions</li>
              </ul>
            </div>
          </div>
        )}

        {!hasRewards && (
          <div className="p-4 text-center text-zinc-600 dark:text-zinc-400 text-sm">
            <p className="mb-2">No rewards yet. Use dApps to earn tokens!</p>
            <p className="text-xs">Each dApp interaction can earn you both GRID (ecosystem) and dApp-specific tokens.</p>
          </div>
        )}
      </div>
    </div>
  );
}

