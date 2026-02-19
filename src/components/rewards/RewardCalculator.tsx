'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { CalculatorInputs, KREXTier, NFTStatus, CustomBaseRewards, NodeProviderStatus, SupplyMetrics, FeeSettings } from '@/lib/rewards/types';
import { KREX_TIERS, BASE_REWARDS, DEFAULT_NODE_MULTIPLIER, DEFAULT_NODE_FEE_REDUCTION, DEFAULT_FEE_DISTRIBUTION, DEFAULT_BASE_FEE_PERCENT } from '@/lib/rewards/types';
import { calculateRewards, validateInputs } from '@/lib/rewards/calculator';
import { RewardBreakdown } from './RewardBreakdown';
import { PointsDisplay } from './PointsDisplay';
import { MultiplierDisplay } from './MultiplierDisplay';
import { FeeDistribution } from './FeeDistribution';
import { SupplyMetrics as SupplyMetricsDisplay } from './SupplyMetrics';
import { BadgesDisplay } from './BadgesDisplay';
import { EcosystemPerks } from './EcosystemPerks';

export function RewardCalculator() {
  const [kasAmount, setKasAmount] = useState<number>(10);
  const [krexTier, setKrexTier] = useState<KREXTier>('Tier1');
  const [nftStatus, setNftStatus] = useState<NFTStatus>({
    hasKREXPRIME: false,
    hasPIXELKREX: false,
    hasDiamondKREXPRIME: false,
    hasDiamondPIXELKREX: false,
    hasRarestNFT: false,
  });
  const [seasonalBoost, setSeasonalBoost] = useState<number>(0);
  const [customBaseRewards, setCustomBaseRewards] = useState<CustomBaseRewards>({
    grtPerKas: BASE_REWARDS.GRT_PER_KAS,
    xpPerKas: BASE_REWARDS.XP_PER_KAS,
    useCustom: false,
  });
  const [nodeProvider, setNodeProvider] = useState<NodeProviderStatus>({
    isNodeProvider: false,
    nodeMultiplier: DEFAULT_NODE_MULTIPLIER,
    nodeFeeReduction: DEFAULT_NODE_FEE_REDUCTION,
  });
  const [supplyMetrics, setSupplyMetrics] = useState<SupplyMetrics>({
    grtMaxSupply: 100_000_000_000, // 100B
    dailyKasSpent: 1000,
    numberOfUsers: 100,
    grtMinted: 0,
  });
  const [feeSettings, setFeeSettings] = useState<FeeSettings>({
    baseFeePercent: DEFAULT_BASE_FEE_PERCENT,
    useCustomDistribution: false,
    kasparexPercent: DEFAULT_FEE_DISTRIBUTION.KASPAREX,
    grtTreasuryPercent: DEFAULT_FEE_DISTRIBUTION.GRT_TREASURY,
  });

  // Build inputs object
  const inputs: CalculatorInputs = useMemo(
    () => ({
      kasAmount,
      krexTier,
      nftStatus,
      seasonalBoost,
      customBaseRewards,
      nodeProvider,
      feeSettings,
    }),
    [kasAmount, krexTier, nftStatus, seasonalBoost, customBaseRewards, nodeProvider, feeSettings]
  );

  // Validate inputs
  const validation = useMemo(() => validateInputs(inputs), [inputs]);

  // Calculate rewards
  const result = useMemo(() => {
    if (!validation.valid || kasAmount <= 0) {
      return null;
    }
    return calculateRewards(inputs, supplyMetrics);
  }, [inputs, validation.valid, kasAmount, supplyMetrics]);

  const handleKASChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setKasAmount(Math.max(0, value));
  };

  const handleTierChange = (tier: KREXTier) => {
    setKrexTier(tier);
  };

  const handleNFTToggle = (nft: 'KREXPRIME' | 'PIXELKREX' | 'DiamondKREXPRIME' | 'DiamondPIXELKREX') => {
    setNftStatus((prev) => {
      if (nft === 'KREXPRIME') {
        return { ...prev, hasKREXPRIME: !prev.hasKREXPRIME };
      } else if (nft === 'PIXELKREX') {
        return { ...prev, hasPIXELKREX: !prev.hasPIXELKREX };
      } else if (nft === 'DiamondKREXPRIME') {
        return { ...prev, hasDiamondKREXPRIME: !prev.hasDiamondKREXPRIME };
      } else {
        return { ...prev, hasDiamondPIXELKREX: !prev.hasDiamondPIXELKREX };
      }
    });
  };

  const handleSeasonalBoostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setSeasonalBoost(Math.max(0, value));
  };

  const handleCustomRewardsToggle = () => {
    setCustomBaseRewards((prev) => ({
      ...prev,
      useCustom: !prev.useCustom,
    }));
  };

  const handleCustomRewardChange = (field: 'grtPerKas' | 'xpPerKas', value: number) => {
    setCustomBaseRewards((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  const handleNodeProviderToggle = () => {
    setNodeProvider((prev) => ({
      ...prev,
      isNodeProvider: !prev.isNodeProvider,
    }));
  };

  const handleNodeMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 1;
    setNodeProvider((prev) => ({
      ...prev,
      nodeMultiplier: Math.max(1, value),
    }));
  };

  const handleNodeFeeReductionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setNodeProvider((prev) => ({
      ...prev,
      nodeFeeReduction: Math.max(0, value),
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input Section */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Calculator Settings
            </h2>

            <div className="space-y-6">
              {/* KAS Amount Input */}
              <div>
                <label className="k-label">
                  KAS Amount to Spend
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={kasAmount}
                    onChange={handleKASChange}
                    min="0"
                    step="0.1"
                    className="k-input pr-12"
                    placeholder="Enter KAS amount"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                    KAS
                  </span>
                </div>
                {!customBaseRewards.useCustom && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Default: 1 KAS = 10,000 GRID + 100 XP Points
                  </p>
                )}
              </div>

              {/* Custom Base Rewards */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center space-x-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={customBaseRewards.useCustom}
                    onChange={handleCustomRewardsToggle}
                    className="w-4 h-4 text-[#02abb8] border-zinc-300 dark:border-zinc-700 rounded focus:ring-[#02abb8] focus:ring-2"
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Use Custom Base Rewards
                  </span>
                </label>
                {customBaseRewards.useCustom && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                        GRT per KAS
                      </label>
                      <input
                        type="number"
                        value={customBaseRewards.grtPerKas}
                        onChange={(e) => handleCustomRewardChange('grtPerKas', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                        XP Points per KAS
                      </label>
                      <input
                        type="number"
                        value={customBaseRewards.xpPerKas}
                        onChange={(e) => handleCustomRewardChange('xpPerKas', parseFloat(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* KREX Tier Selector */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  KREX Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Tier0', 'Tier1', 'Tier2', 'Tier3', 'Tier4'] as KREXTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => handleTierChange(tier)}
                      className={`p-3 rounded-lg border-2 transition-all ${krexTier === tier
                          ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                    >
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {KREX_TIERS[tier].label}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {KREX_TIERS[tier].description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* NFT Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  NFT Ownership
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX}
                        onChange={() => {
                          // Toggle both together
                          const newValue = !(nftStatus.hasKREXPRIME || nftStatus.hasPIXELKREX);
                          setNftStatus(prev => ({
                            ...prev,
                            hasKREXPRIME: newValue,
                            hasPIXELKREX: newValue,
                          }));
                        }}
                        className="w-4 h-4 text-[#02abb8] border-zinc-300 dark:border-zinc-700 rounded focus:ring-[#02abb8] focus:ring-2"
                      />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">KREXPRIME or PIXELKREX</span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      +1x multiplier, -0.1% fee
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX}
                        onChange={() => {
                          // Toggle both together
                          const newValue = !(nftStatus.hasDiamondKREXPRIME || nftStatus.hasDiamondPIXELKREX);
                          setNftStatus(prev => ({
                            ...prev,
                            hasDiamondKREXPRIME: newValue,
                            hasDiamondPIXELKREX: newValue,
                          }));
                        }}
                        className="w-4 h-4 text-purple-600 border-purple-300 dark:border-purple-700 rounded focus:ring-purple-600 focus:ring-2"
                      />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">💎 Diamond NFT (any collection)</span>
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      +3x multiplier, -0.2% fee
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-500/40">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={nftStatus.hasRarestNFT}
                        onChange={() => {
                          setNftStatus(prev => ({
                            ...prev,
                            hasRarestNFT: !prev.hasRarestNFT,
                          }));
                        }}
                        className="w-4 h-4 text-yellow-600 border-yellow-300 dark:border-yellow-700 rounded focus:ring-yellow-600 focus:ring-2"
                      />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">⭐ Rarest NFT (any collection)</span>
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                      +5x multiplier, 0.0% fee
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Holding at least 1 NFT from KREXPRIME or PIXELKREX gives +1x. Holding any Diamond NFT gives +3x. Rarest NFT (any collection) gives +5x and 0.0% fee (highest priority).
                  </p>
                </div>
              </div>

              {/* Node Provider Section */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <label className="flex items-center space-x-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={nodeProvider.isNodeProvider}
                    onChange={handleNodeProviderToggle}
                    className="w-4 h-4 text-blue-600 border-blue-300 dark:border-blue-700 rounded focus:ring-blue-600 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Krex Node Provider
                  </span>
                </label>
                {nodeProvider.isNodeProvider && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <label className="k-label text-xs mb-1">
                        Node Multiplier (e.g., 1.5x, 2x)
                      </label>
                      <input
                        type="number"
                        value={nodeProvider.nodeMultiplier}
                        onChange={handleNodeMultiplierChange}
                        min="1"
                        step="0.1"
                        className="k-input py-1.5 px-3 h-auto min-h-0"
                      />
                    </div>
                    <div>
                      <label className="k-label text-xs mb-1">
                        Fee Reduction (%)
                      </label>
                      <input
                        type="number"
                        value={nodeProvider.nodeFeeReduction}
                        onChange={handleNodeFeeReductionChange}
                        min="0"
                        step="0.1"
                        className="k-input py-1.5 px-3 h-auto min-h-0"
                      />
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Node providers secure the Kasparex ecosystem and receive additional multipliers and fee reductions.
                    </p>
                  </div>
                )}
              </div>

              {/* Supply Metrics */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
                  Token Supply Metrics
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="k-label text-xs mb-1">
                      GRT Max Supply
                    </label>
                    <input
                      type="number"
                      value={supplyMetrics.grtMaxSupply}
                      onChange={(e) => setSupplyMetrics(prev => ({ ...prev, grtMaxSupply: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      className="k-input py-1.5 px-3 h-auto min-h-0"
                    />
                  </div>
                  <div>
                    <label className="k-label text-xs mb-1">
                      Daily KAS Spent
                    </label>
                    <input
                      type="number"
                      value={supplyMetrics.dailyKasSpent}
                      onChange={(e) => setSupplyMetrics(prev => ({ ...prev, dailyKasSpent: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      className="k-input py-1.5 px-3 h-auto min-h-0"
                    />
                  </div>
                  <div>
                    <label className="k-label text-xs mb-1">
                      Number of Users
                    </label>
                    <input
                      type="number"
                      value={supplyMetrics.numberOfUsers}
                      onChange={(e) => setSupplyMetrics(prev => ({ ...prev, numberOfUsers: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      className="k-input py-1.5 px-3 h-auto min-h-0"
                    />
                  </div>
                  <div>
                    <label className="k-label text-xs mb-1">
                      GRT Already Minted
                    </label>
                    <input
                      type="number"
                      value={supplyMetrics.grtMinted}
                      onChange={(e) => setSupplyMetrics(prev => ({ ...prev, grtMinted: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      className="k-input py-1.5 px-3 h-auto min-h-0"
                    />
                  </div>
                </div>
              </div>

              {/* Seasonal Boost */}
              <div>
                <label className="k-label">
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
                    className="k-input pr-12"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                    %
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Optional: Add percentage boost for seasonal events (applies to GRID rewards)
                </p>
              </div>
            </div>

            {/* Validation Errors */}
            {!validation.valid && validation.errors.length > 0 && (
              <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              <RewardBreakdown result={result} />
              <PointsDisplay result={result} />
              <MultiplierDisplay
                krexTier={krexTier}
                nftStatus={nftStatus}
                nodeProvider={nodeProvider}
                result={result}
              />
              <FeeDistribution result={result} kasAmount={kasAmount} />
              <BadgesDisplay
                krexTier={krexTier}
                nftStatus={nftStatus}
                nodeProvider={nodeProvider}
              />
              <EcosystemPerks
                krexTier={krexTier}
                nftStatus={nftStatus}
                nodeProvider={nodeProvider}
              />
              <SupplyMetricsDisplay result={result} />
            </>
          ) : (
            <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Enter a valid KAS amount to see your rewards
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
