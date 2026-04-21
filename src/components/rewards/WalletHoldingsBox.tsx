'use client';

import { useMemo } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getChainById } from '@/lib/wagmi';
import { formatLargeNumber } from '@/lib/rewards/calculator';

export function WalletHoldingsBox() {
  const { address, isConnected } = useAccount();
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

  const { formattedBalance: gridFormattedBalance, isLoading } = useGRIDToken(gridTokenAddress);

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        Wallet Holdings
      </h3>
      
      {!isConnected ? (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
            Connect wallet to view holdings
          </p>
          <div className="text-xs text-zinc-400 dark:text-zinc-500">
            GRID and balances
          </div>
        </div>
      ) : gridTokenAddress ? (
        <div className="space-y-3">
          <div className="pb-2 border-b border-zinc-200 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                GRID
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {isLoading ? '...' : formatLargeNumber(parseFloat(gridFormattedBalance || '0'))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            GRID token not deployed on this network
          </p>
        </div>
      )}
    </div>
  );
}
