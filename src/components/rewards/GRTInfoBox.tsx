'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getChainById } from '@/lib/wagmi';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function GRTInfoBox() {
  const chainId = useChainId();
  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = Boolean(chain?.testnet);
  const gridTokenAddress = useMemo(() => {
    if (isTestnet) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      if (tgrid) return tgrid;
    }
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId, isTestnet]);

  const { totalSupply, maxSupply, isLoading } = useGRIDToken(gridTokenAddress);

  const metrics = useMemo(() => {
    if (!totalSupply || !maxSupply || Number(maxSupply) === 0) return null;
    const minted = Number(totalSupply) / 1e18;
    const max = Number(maxSupply) / 1e18;
    const progress = max > 0 ? (minted / max) * 100 : 0;
    return { minted, maxSupply: max, progress };
  }, [totalSupply, maxSupply]);

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        GRT (GRID) Token
      </h3>
      
      <div className="space-y-3">
        {/* Max Supply and Progress - real contract data only */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Max Supply
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {metrics ? `${metrics.progress.toFixed(2)}% minted` : (isLoading ? '...' : '-')}
            </span>
          </div>
          
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-2">
            <div
              className="bg-[#02abb8] h-2 rounded-full transition-all"
              style={{ width: `${metrics ? Math.min(100, metrics.progress) : 0}%` }}
            />
          </div>
          
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {metrics ? `${formatLargeNumber(metrics.minted)} / ${formatLargeNumber(metrics.maxSupply)}` : (isLoading && gridTokenAddress ? '...' : '-')}
          </div>
        </div>
      </div>
    </div>
  );
}
