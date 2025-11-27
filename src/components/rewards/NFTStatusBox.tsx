'use client';

import { useAccount } from 'wagmi';

// Mock NFT status for simulation
const mockNFTStatus = {
  hasKREXPRIME: false,
  hasPIXELKREX: false,
  hasDiamondKREXPRIME: false,
  hasDiamondPIXELKREX: false,
  hasRarestNFT: false,
};

export function NFTStatusBox() {
  const { isConnected } = useAccount();
  const hasAnyNFT = mockNFTStatus.hasKREXPRIME || mockNFTStatus.hasPIXELKREX;
  const hasDiamondNFT = mockNFTStatus.hasDiamondKREXPRIME || mockNFTStatus.hasDiamondPIXELKREX;
  const hasRarestNFT = mockNFTStatus.hasRarestNFT;

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
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
          <span className={mockNFTStatus.hasKREXPRIME ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
            {mockNFTStatus.hasKREXPRIME ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">PIXELKREX:</span>
          <span className={mockNFTStatus.hasPIXELKREX ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
            {mockNFTStatus.hasPIXELKREX ? '✓ Owned' : 'Not owned'}
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
          <span className={hasRarestNFT ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-zinc-400'}>
            {hasRarestNFT ? '✓ Owned' : 'Not owned'}
          </span>
        </div>
        {hasAnyNFT && (
          <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            {hasRarestNFT ? (
              <>
                <span className="text-yellow-600 dark:text-yellow-400 font-medium">+5x multiplier, 0.0% fee</span>
              </>
            ) : hasDiamondNFT ? (
              <>
                <span className="text-purple-600 dark:text-purple-400 font-medium">+3x multiplier, -0.2% fee</span>
              </>
            ) : (
              <>
                <span className="text-green-600 dark:text-green-400 font-medium">+1x multiplier, -0.1% fee</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

