'use client';

import type { KREXTier, NFTStatus, NodeProviderStatus } from '@/lib/rewards/types';
import { KREX_TIERS } from '@/lib/rewards/types';

interface MultiplierDisplayProps {
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  nodeProvider: { isNodeProvider: boolean; nodeMultiplier: number };
  result: {
    krexMultiplier: number;
    nftMultiplier: number;
    nodeMultiplier: number;
    seasonalMultiplier: number;
    totalMultiplier: number;
  };
  className?: string;
}

export function MultiplierDisplay({
  krexTier,
  nftStatus,
  nodeProvider,
  result,
  className = '',
}: MultiplierDisplayProps) {
  const tierConfig = KREX_TIERS[krexTier];
  const hasAnyNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;
  const hasDiamondNFT = nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX;
  const hasRarestNFT = nftStatus.hasRarestNFT;

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Multipliers & Status
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KREX Tier Card */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              KREX Tier
            </span>
            <span className="text-xs px-2 py-1 bg-[#02abb8]/10 text-[#02abb8] rounded-full">
              {tierConfig.label}
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {tierConfig.multiplier}x Multiplier
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {tierConfig.description}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Fee Reduction: -{tierConfig.feeReduction}%
            </div>
          </div>
        </div>

        {/* NFT Status Card */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              NFT Status
            </span>
            {hasAnyNFT && (
              <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">KREXPRIME or PIXELKREX:</span>
              <span className={(nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX) ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                {(nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX) ? '✓ Owned' : 'Not owned'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">💎 Diamond NFT:</span>
              <span className={hasDiamondNFT ? 'text-purple-600 dark:text-purple-400 font-medium' : 'text-zinc-400'}>
                {hasDiamondNFT ? '✓ Owned' : 'Not owned'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">⭐ Rarest NFT:</span>
              <span className={hasRarestNFT ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-zinc-400'}>
                {hasRarestNFT ? '✓ Owned' : 'Not owned'}
              </span>
            </div>
            {hasAnyNFT && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                {hasRarestNFT ? (
                  <>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">+5x multiplier (Rarest NFT any collection)</span>
                    <br />
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">0.0% fee</span>
                  </>
                ) : hasDiamondNFT ? (
                  <>
                    +3x multiplier (Diamond NFT from any collection)
                    <br />
                    -0.2% fee reduction
                  </>
                ) : (
                  <>
                    +1x multiplier (at least 1 NFT from KREXPRIME or PIXELKREX)
                    <br />
                    -0.1% fee reduction
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Provider Status */}
      {nodeProvider.isNodeProvider && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Node Provider
            </span>
            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full">
              Active
            </span>
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {result.nodeMultiplier}x multiplier, fee reduction active
          </div>
        </div>
      )}

      {/* Multiplier Breakdown */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">
          Multiplier Breakdown
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-400">KREX Tier:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{result.krexMultiplier}x</span>
          </div>
          {result.nftMultiplier > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">NFT Multiplier:</span>
              <span className="font-medium text-green-600 dark:text-green-400">{result.nftMultiplier}x</span>
            </div>
          )}
          {result.nodeMultiplier > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Node Provider:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{result.nodeMultiplier}x</span>
            </div>
          )}
          {result.seasonalMultiplier > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Seasonal Boost:</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">{result.seasonalMultiplier.toFixed(2)}x</span>
            </div>
          )}
        </div>
      </div>

      {/* Total Multiplier */}
      <div className="p-4 bg-gradient-to-r from-[#02abb8]/10 to-[#02abb8]/5 rounded-lg border border-[#02abb8]/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Total Reward Multiplier
          </span>
          <span className="text-2xl font-bold text-[#02abb8]">
            {result.totalMultiplier.toFixed(2)}x
          </span>
        </div>
      </div>
    </div>
  );
}

