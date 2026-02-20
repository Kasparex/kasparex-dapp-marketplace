'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useMemo } from 'react';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KREX_TIERS, NFT_FEE_REDUCTION, DIAMOND_NFT_FEE_REDUCTION, RAREST_NFT_FEE_REDUCTION, NFT_COST_REDUCTION, DIAMOND_NFT_COST_REDUCTION, RAREST_NFT_COST_REDUCTION, LIGHT_NODE_COST_REDUCTION, MIRROR_NODE_COST_REDUCTION } from '@/lib/rewards/types';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { calculateCost, formatCostBreakdown, formatPrice } from '@/lib/payments/calculator';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

interface DAppActionFlowProps {
  dapp: DApp;
}

// Get dApp-specific actions and rewards (GRT-only)
function getDAppActions(dapp: DApp, chainId?: number, nativeSymbol: string = 'KAS'): Array<{
  step: number;
  action: string;
  cost: string;
  costKAS: number;
  baseRewards: {
    grid: number;
    xp: number;
  };
  nextStep?: string;
}> {
  const name = dapp.name.toLowerCase();
  const category = dapp.category.toLowerCase();
  const rewards = getDefaultRewardsBreakdown(chainId);

  // DAO Voting specific actions
  if (name.includes('dao') || name.includes('voting')) {
    return [
      {
        step: 1,
        action: 'Submit Proposal',
        cost: `10 ${nativeSymbol}`,
        costKAS: 10,
        baseRewards: {
          grid: rewards.grtPerKas * 10,
          xp: rewards.xpPerKas * 10,
        },
        nextStep: 'Wait for voting period',
      },
      {
        step: 2,
        action: 'Cast Vote',
        cost: `1 ${nativeSymbol}`,
        costKAS: 1,
        baseRewards: {
          grid: rewards.grtPerKas,
          xp: rewards.xpPerKas,
        },
        nextStep: 'View results',
      },
    ];
  }

  // Subscription specific actions
  if (category === 'subscription' || name.includes('subscription')) {
    return [
      {
        step: 1,
        action: 'Subscribe',
        cost: `5 ${nativeSymbol}`,
        costKAS: 5,
        baseRewards: {
          grid: rewards.grtPerKas * 5,
          xp: rewards.xpPerKas * 5,
        },
        nextStep: 'Access content',
      },
      {
        step: 2,
        action: 'Renew Subscription',
        cost: `5 ${nativeSymbol}`,
        costKAS: 5,
        baseRewards: {
          grid: rewards.grtPerKas * 5,
          xp: rewards.xpPerKas * 5,
        },
        nextStep: 'Continue access',
      },
    ];
  }

  // Payment specific actions
  if (category === 'payment' || name.includes('payment')) {
    return [
      {
        step: 1,
        action: 'Send Payment',
        cost: `1 ${nativeSymbol}`,
        costKAS: 1,
        baseRewards: {
          grid: rewards.grtPerKas,
          xp: rewards.xpPerKas,
        },
        nextStep: 'Payment processed',
      },
    ];
  }

  // Default actions for other dApps
  return [
    {
      step: 1,
      action: 'Use dApp',
      cost: `1 ${nativeSymbol}`,
      costKAS: 1,
      baseRewards: {
        grid: rewards.grtPerKas,
        xp: rewards.xpPerKas,
      },
      nextStep: 'Complete action',
    },
  ];
}

export function DAppActionFlow({ dapp }: DAppActionFlowProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const actions = getDAppActions(dapp, chainId, nativeSymbol);

  const gridTokenAddress = useMemo(() => {
    if (chainId === 38836 || chainId === 38837) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      if (tgrid) return tgrid;
    }
    if (chainId === 167012) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      if (tgrid) return tgrid;
    }
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId]);
  const isTestnetGrid = useMemo(() => {
    if (!gridTokenAddress) return false;
    const tgrid = chainId === 38836 || chainId === 38837 ? getContractAddress(chainId, 'tGRID') : chainId === 167012 ? getContractAddress(chainId, 'tGRID') : null;
    return tgrid ? gridTokenAddress === tgrid : false;
  }, [chainId, gridTokenAddress]);
  const gridLabel = isTestnetGrid ? 'tGRID' : 'GRID';
  const { formattedBalance: gridFormattedBalance, isLoading: isGRIDLoading } = useGRIDToken(gridTokenAddress);
  const { totalPoints: xpPoints, isLoading: isXPLoading } = useLoyaltyPoints();
  
  // Get KREX tier and multipliers from real balance
  const { balance: krexBalance, tier, isLoading: isKREXLoading } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const tierConfig = KREX_TIERS[tier];
  const multiplier = tierConfig.multiplier;

  const networkType = getDAppNetworkType(dapp);
  const paymentConfig = getDAppPaymentConfig(dapp, networkType);

  // Calculate costs for each action using the new calculator
  const actionsWithCalculatedCosts = actions.map((action, index) => {
    // Map action names to action IDs
    const actionId = paymentConfig?.actions[index]?.actionId || 
                     action.action.toLowerCase().replace(/\s+/g, '-') || 
                     'use-dapp';
    
    const costBreakdown = calculateCost({
      dapp,
      actionId,
      krexBalance,
      krexTier: tier,
      hasAnyNFT: !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
        (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(v => v))),
      hasDiamondNFT: !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
        (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(v => v))),
      hasRarestNFT: !!nftStatus?.hasRarestNFT,
      isNodeProvider: false, // TODO: Get from node status hook
      nodeFeeReduction: 0,
    });
    
    return {
      ...action,
      calculatedCost: costBreakdown,
      displayCost: formatCostBreakdown(costBreakdown, nativeSymbol),
      finalCostKAS: costBreakdown.finalCostWithFee,
    };
  });
  
  // Use calculated fee percent and cost reduction for display
  const firstActionCost = actionsWithCalculatedCosts[0]?.calculatedCost;
  const feePercent = firstActionCost?.feePercent || 1.0;
  const costReductionPercent = firstActionCost?.costReductionPercent || 0;
  const baseFee = 1.0; // Base fee is 1%
  const totalFeeReduction = baseFee - feePercent;

  // Calculate total predicted rewards if user completes all actions
  const totalPredicted = actionsWithCalculatedCosts.reduce(
    (acc, action) => {
      return {
        grid: acc.grid + action.baseRewards.grid * multiplier,
        xp: acc.xp + action.baseRewards.xp * multiplier,
        totalCost: acc.totalCost + (action.finalCostKAS || action.costKAS),
      };
    },
    { grid: 0, xp: 0, totalCost: 0 }
  );

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Action Flow
        </h3>
      </div>

      {/* Current Holdings */}
      {isConnected && (
        <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Current Holdings</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">KREX</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {isKREXLoading ? 'Loading...' : formatLargeNumber(krexBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">{gridLabel}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {gridTokenAddress ? (isGRIDLoading ? '...' : (gridFormattedBalance || '0')) : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">XP</span>
              <span className="font-medium text-[#02abb8]">
                {isXPLoading ? '...' : formatLargeNumber(xpPoints)}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Tier</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {tierConfig.label} ({multiplier}x)
                </span>
              </div>
              {costReductionPercent > 0 && (
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-zinc-600 dark:text-zinc-400">Cost Reduction</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    -{costReductionPercent.toFixed(0)}%
                  </span>
                </div>
              )}
              {totalFeeReduction > 0 && (
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-zinc-600 dark:text-zinc-400">Fee Reduction</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    -{totalFeeReduction.toFixed(2)}%
                  </span>
                </div>
              )}
              {feePercent < baseFee && (
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-zinc-600 dark:text-zinc-400">Current Fee</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {feePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Flow */}
      <div className="space-y-4">
        {actionsWithCalculatedCosts.map((action, index) => {
          const adjustedRewards = {
            grid: action.baseRewards.grid * multiplier,
            xp: action.baseRewards.xp * multiplier,
          };
          // Use calculated cost from the new calculator
          const calculatedCost = action.calculatedCost;
          const totalCostWithFee = action.finalCostKAS;

          return (
            <div key={action.step} className="relative">
              {/* Timeline Line */}
              {index < actions.length - 1 && (
                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
              )}

              {/* Step Content */}
              <div className="relative flex gap-3">
                {/* Step Number Circle */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{action.step}</span>
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      {action.action}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        Cost: <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {formatPrice(totalCostWithFee)} {nativeSymbol}
                          {calculatedCost && calculatedCost.feePercent > 0 && (
                            <span className="text-zinc-500 dark:text-zinc-400 font-normal"> (includes {calculatedCost.feePercent.toFixed(2)}% fee)</span>
                          )}
                          {calculatedCost && (calculatedCost.costReductionPercent > 0 || calculatedCost.feePercent < 1.0) && (
                            <span className="ml-1 text-green-600 dark:text-green-400">
                              {calculatedCost.costReductionPercent > 0 && ` -${calculatedCost.costReductionPercent.toFixed(0)}% cost`}
                              {calculatedCost.feePercent < 1.0 && calculatedCost.feePercent > 0 && `, ${calculatedCost.feePercent.toFixed(2)}% fee`}
                            </span>
                          )}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">Rewards</div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">GRID</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {formatLargeNumber(adjustedRewards.grid)}
                          {multiplier > 1 && (
                            <span className="ml-1 text-green-600 dark:text-green-400">
                              ({multiplier}x)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">XP</span>
                        <span className="font-medium text-[#02abb8]">
                          {formatLargeNumber(adjustedRewards.xp)}
                          {multiplier > 1 && (
                            <span className="ml-1 text-green-600 dark:text-green-400">
                              ({multiplier}x)
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Step */}
                  {action.nextStep && (
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 italic">
                      → {action.nextStep}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Predicted Rewards */}
      {actions.length > 1 && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">Total Predicted (All Actions)</div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Total Cost</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {formatPrice(totalPredicted.totalCost)} {nativeSymbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Total GRID</span>
                <span className="font-medium text-[#02abb8]">
                  {formatLargeNumber(totalPredicted.grid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Total XP</span>
                <span className="font-medium text-[#02abb8]">
                  {formatLargeNumber(totalPredicted.xp)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

