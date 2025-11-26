'use client';

import { useState, useMemo } from 'react';
import type { CalculatorInputs, KREXTier, NFTStatus } from '@/lib/rewards/types';
import { calculateRewards, validateInputs } from '@/lib/rewards/calculator';
import { RewardBreakdown } from './RewardBreakdown';
import { PointsDisplay } from './PointsDisplay';
import { MultiplierDisplay } from './MultiplierDisplay';
import { FeeDistribution } from './FeeDistribution';

export function RewardCalculator() {
  const [kasAmount, setKasAmount] = useState<number>(10);
  const [krexTier, setKrexTier] = useState<KREXTier>('Tier0');
  const [nftStatus, setNftStatus] = useState<NFTStatus>({
    hasKREXPRIME: false,
    hasPIXELKREX: false,
  });
  const [seasonalBoost, setSeasonalBoost] = useState<number>(0);

  // Build inputs object
  const inputs: CalculatorInputs = useMemo(
    () => ({
      kasAmount,
      krexTier,
      nftStatus,
      seasonalBoost,
    }),
    [kasAmount, krexTier, nftStatus, seasonalBoost]
  );

  // Validate inputs
  const validation = useMemo(() => validateInputs(inputs), [inputs]);

  // Calculate rewards
  const result = useMemo(() => {
    if (!validation.valid || kasAmount <= 0) {
      return null;
    }
    return calculateRewards(inputs);
  }, [inputs, validation.valid, kasAmount]);

  const handleKASChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setKasAmount(Math.max(0, value));
  };

  const handleTierChange = (tier: KREXTier) => {
    setKrexTier(tier);
  };

  const handleNFTToggle = (nft: 'KREXPRIME' | 'PIXELKREX') => {
    setNftStatus((prev) => ({
      ...prev,
      [nft === 'KREXPRIME' ? 'hasKREXPRIME' : 'hasPIXELKREX']: !prev[nft === 'KREXPRIME' ? 'hasKREXPRIME' : 'hasPIXELKREX'],
    }));
  };

  const handleSeasonalBoostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setSeasonalBoost(Math.max(0, value));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="p-6 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          Reward Calculator
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Simulate your rewards based on KAS spent, KREX tier, NFT ownership, and seasonal boosters.
        </p>

        <div className="space-y-6">
          {/* KAS Amount Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              KAS Amount to Spend
            </label>
            <div className="relative">
              <input
                type="number"
                value={kasAmount}
                onChange={handleKASChange}
                min="0"
                step="0.1"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
                placeholder="Enter KAS amount"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                KAS
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Base rewards: 1 KAS = 10,000 GRT + 1,000 LRT + 100 XP Points
            </p>
          </div>

          {/* KREX Tier Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              KREX Tier
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['Tier0', 'Tier1', 'Tier2', 'Tier3'] as KREXTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleTierChange(tier)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    krexTier === tier
                      ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {tier === 'Tier0' ? 'Tier 0' : tier === 'Tier1' ? 'Tier 1' : tier === 'Tier2' ? 'Tier 2' : 'Tier 3'}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {tier === 'Tier0'
                      ? '< 1M KREX'
                      : tier === 'Tier1'
                      ? '≥ 1M KREX'
                      : tier === 'Tier2'
                      ? '≥ 10M KREX'
                      : '≥ 100M KREX'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* NFT Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              NFT Ownership (Fee Reduction)
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nftStatus.hasKREXPRIME}
                  onChange={() => handleNFTToggle('KREXPRIME')}
                  className="w-4 h-4 text-[#02abb8] border-zinc-300 dark:border-zinc-700 rounded focus:ring-[#02abb8] focus:ring-2"
                />
                <span className="text-sm text-zinc-900 dark:text-zinc-100">KREXPRIME</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">(-0.2% fee)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nftStatus.hasPIXELKREX}
                  onChange={() => handleNFTToggle('PIXELKREX')}
                  className="w-4 h-4 text-[#02abb8] border-zinc-300 dark:border-zinc-700 rounded focus:ring-[#02abb8] focus:ring-2"
                />
                <span className="text-sm text-zinc-900 dark:text-zinc-100">PIXELKREX</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">(-0.2% fee)</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Each NFT reduces fees by 0.2% (stacks with tier reductions)
            </p>
          </div>

          {/* Seasonal Boost */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Seasonal Boost (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={seasonalBoost}
                onChange={handleSeasonalBoostChange}
                min="0"
                max="1000"
                step="1"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">
                %
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Optional: Add percentage boost for seasonal events (applies to GRT and LRT rewards)
            </p>
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.valid && validation.errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          <RewardBreakdown result={result} />
          <PointsDisplay result={result} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MultiplierDisplay
              krexTier={krexTier}
              nftStatus={nftStatus}
              totalMultiplier={result.totalMultiplier}
            />
            <FeeDistribution result={result} kasAmount={kasAmount} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && kasAmount > 0 && (
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            Enter a valid KAS amount to see your rewards
          </p>
        </div>
      )}
    </div>
  );
}

