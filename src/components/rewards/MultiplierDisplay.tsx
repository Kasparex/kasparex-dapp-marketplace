'use client';

import type { KREXTier, NFTStatus } from '@/lib/rewards/types';
import { KREX_TIERS } from '@/lib/rewards/types';

interface MultiplierDisplayProps {
  krexTier: KREXTier;
  nftStatus: NFTStatus;
  totalMultiplier: number;
  className?: string;
}

export function MultiplierDisplay({
  krexTier,
  nftStatus,
  totalMultiplier,
  className = '',
}: MultiplierDisplayProps) {
  const tierConfig = KREX_TIERS[krexTier];
  const hasAnyNFT = nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX;

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
              Fee: {tierConfig.feePercent}%
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
              <span className="text-zinc-600 dark:text-zinc-400">KREXPRIME:</span>
              <span className={nftStatus.hasKREXPRIME ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                {nftStatus.hasKREXPRIME ? '✓ Owned' : 'Not owned'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">PIXELKREX:</span>
              <span className={nftStatus.hasPIXELKREX ? 'text-green-600 dark:text-green-400 font-medium' : 'text-zinc-400'}>
                {nftStatus.hasPIXELKREX ? '✓ Owned' : 'Not owned'}
              </span>
            </div>
            {hasAnyNFT && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                -0.2% fee reduction per NFT
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Total Multiplier */}
      <div className="p-4 bg-gradient-to-r from-[#02abb8]/10 to-[#02abb8]/5 rounded-lg border border-[#02abb8]/20">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Total Reward Multiplier
          </span>
          <span className="text-2xl font-bold text-[#02abb8]">
            {totalMultiplier.toFixed(2)}x
          </span>
        </div>
      </div>
    </div>
  );
}

