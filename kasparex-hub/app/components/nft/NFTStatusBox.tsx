/**
 * NFT Status Box Component
 * Displays user's NFT status (KREXPRIME, PIXELKREX, Diamond, Rare)
 */

import { useNFTStatus } from '~/hooks/useNFTStatus';
import type { NFTStatus } from '~/lib/nft/status';

export function NFTStatusBox() {
  const { nftStatus, isLoading, error } = useNFTStatus();

  if (isLoading) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading NFT status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="text-sm text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!nftStatus) {
    return (
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Connect wallet to view NFT status</div>
      </div>
    );
  }

  const hasAnyNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;
  const hasDiamondNFT = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX;

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          NFT Status
        </h3>
        {hasAnyNFT && (
          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">KREXPRIME:</span>
          <span className={nftStatus.hasKREXPRIME ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
            {nftStatus.hasKREXPRIME ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">PIXELKREX:</span>
          <span className={nftStatus.hasPIXELKREX ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
            {nftStatus.hasPIXELKREX ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">💎 Diamond:</span>
          <span className={hasDiamondNFT ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-zinc-400'}>
            {hasDiamondNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">⭐ Rarest:</span>
          <span className={nftStatus.hasRarestNFT ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-zinc-400'}>
            {nftStatus.hasRarestNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
      </div>
    </div>
  );
}
