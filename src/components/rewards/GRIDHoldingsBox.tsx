'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import Link from 'next/link';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { getContractAddress } from '@/lib/contracts/addresses';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { getChainById } from '@/lib/wagmi';
import { isTestMode } from '@/lib/network/testModeCore';
import { TokenLogoImage } from '@/components/ui/TokenLogoImage';
import { getMockGRTSupplyMetrics } from '@/lib/rewards/mockData';

export function GRIDHoldingsBox() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = isTestMode(chain);
  const gridTokenAddress = useMemo(() => {
    if (isTestnet) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      if (tgrid) return tgrid;
    }
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId, isTestnet]);

  const { formattedBalance: gridFormattedBalance, isLoading, refetch } = useGRIDToken(gridTokenAddress);
  const grtMetrics = getMockGRTSupplyMetrics();

  const tokenLabel = isTestnet ? 'tGRID' : 'GRID';

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TokenLogoImage tokenId="grid" size={20} className="rounded-full" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {tokenLabel}
          </h3>
        </div>
        {isConnected && gridTokenAddress && (
          <button
            type="button"
            onClick={() => refetch()}
            className="text-xs font-medium text-[#02abb8] hover:text-[#0199a3] transition-colors"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Progress Bar Metrics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Max Supply
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {grtMetrics.progress.toFixed(2)}% minted
            </span>
          </div>

          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-2">
            <div
              className="bg-[#02abb8] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, grtMetrics.progress)}%` }}
            />
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {formatLargeNumber(grtMetrics.minted)} / {formatLargeNumber(grtMetrics.maxSupply)}
          </div>
        </div>

        {/* Balance (if connected) - real on-chain */}
        {isConnected && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Your Balance
              </span>
              <span className="text-xl font-bold text-[#02abb8]">
                {gridTokenAddress ? (isLoading ? '...' : (gridFormattedBalance || '0')) : '—'}
              </span>
            </div>
          </div>
        )}
        {!isConnected && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Connect wallet to view balance
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <Link
            href="/tokens/grid"
            className="block w-full mt-2 px-3 py-2 text-xs font-medium text-center bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            View Token Page
          </Link>
        </div>
      </div>
    </div>
  );
}
