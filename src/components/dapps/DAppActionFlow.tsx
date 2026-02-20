'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useMemo } from 'react';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KREX_TIERS } from '@/lib/rewards/types';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getDAppPaymentConfig, getActionCost } from '@/lib/payments/config';
import { calculateCost, formatCostBreakdown, formatPrice } from '@/lib/payments/calculator';
import { getNativeCurrencySymbol, getChainById } from '@/lib/wagmi';

interface DAppActionFlowProps {
  dapp: DApp;
}

export function DAppActionFlow({ dapp }: DAppActionFlowProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const networkType = getDAppNetworkType(dapp);
  const paymentConfig = getDAppPaymentConfig(dapp, networkType);

  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = Boolean(chain?.testnet);
  const gridTokenAddress = useMemo(() => {
    if (isTestnet) {
      const tgrid = getContractAddress(chainId, 'tGRID');
      if (tgrid) return tgrid;
    }
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId, isTestnet]);
  const gridLabel = isTestnet ? 'tGRID' : 'GRID';
  const { formattedBalance: gridFormattedBalance, isLoading: isGRIDLoading, refetch: refetchGRID } = useGRIDToken(gridTokenAddress);
  const { totalPoints: xpPoints, isLoading: isXPLoading, refetch: refetchXP } = useLoyaltyPoints();

  // Refetch holdings on dApp transaction success
  useEffect(() => {
    const handler = () => {
      refetchGRID?.();
      refetchXP?.();
    };
    window.addEventListener('dapp-transaction-success', handler);
    return () => window.removeEventListener('dapp-transaction-success', handler);
  }, [refetchGRID, refetchXP]);
  const { balance: krexBalance, tier, isLoading: isKREXLoading } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const tierConfig = KREX_TIERS[tier];
  const multiplier = tierConfig.multiplier;
  const rewardsBreakdown = getDefaultRewardsBreakdown(chainId);

  const hasAnyNFT = !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
    (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(v => v)));
  const hasDiamondNFT = !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
    (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(v => v)));
  const hasRarestNFT = !!nftStatus?.hasRarestNFT;

  // Build steps from payment config only; calculate cost and rewards per action
  const actionsWithCalculatedCosts = useMemo(() => {
    const actions = paymentConfig?.actions ?? [{ actionId: 'use-dapp', actionName: 'Use dApp', baseCost: 1.0, nextStep: 'Complete action' }];
    return actions.map((configAction, index) => {
      const actionId = configAction.actionId;
      const costKAS = getActionCost(dapp, actionId, networkType);
      const variableAmount = !!configAction.variableAmount;

      const costBreakdown = calculateCost({
        dapp,
        actionId,
        krexBalance: krexBalance ?? 0,
        krexTier: tier,
        hasAnyNFT,
        hasDiamondNFT,
        hasRarestNFT,
        isNodeProvider: false,
        nodeFeeReduction: 0,
      });

      const baseRewardsGrid = variableAmount ? 0 : costKAS * rewardsBreakdown.grtPerKas;
      const baseRewardsXp = variableAmount ? 0 : costKAS * rewardsBreakdown.xpPerKas;

      return {
        step: index + 1,
        action: configAction.actionName,
        actionId,
        nextStep: configAction.nextStep,
        variableAmount,
        costKAS,
        calculatedCost: costBreakdown,
        displayCost: formatCostBreakdown(costBreakdown, nativeSymbol),
        finalCostKAS: costBreakdown.finalCostWithFee,
        baseRewards: { grid: baseRewardsGrid, xp: baseRewardsXp },
      };
    });
  }, [paymentConfig, dapp, networkType, krexBalance, tier, hasAnyNFT, hasDiamondNFT, hasRarestNFT, rewardsBreakdown.grtPerKas, rewardsBreakdown.xpPerKas, nativeSymbol]);

  const firstActionCost = actionsWithCalculatedCosts[0]?.calculatedCost;
  const feePercent = firstActionCost?.feePercent ?? 1.0;
  const costReductionPercent = firstActionCost?.costReductionPercent ?? 0;
  const baseFee = 1.0;
  const totalFeeReduction = baseFee - feePercent;

  const hasVariableAmountStep = actionsWithCalculatedCosts.some(a => a.variableAmount);
  const totalPredicted = actionsWithCalculatedCosts.reduce(
    (acc, action) => ({
      grid: acc.grid + action.baseRewards.grid * multiplier,
      xp: acc.xp + action.baseRewards.xp * multiplier,
      totalCost: acc.totalCost + (action.finalCostKAS ?? action.costKAS),
    }),
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
          const calculatedCost = action.calculatedCost;
          const totalCostWithFee = action.finalCostKAS;
          const isVariable = action.variableAmount;
          const rewardsPerKasGrid = Math.round(rewardsBreakdown.grtPerKas * multiplier);
          const rewardsPerKasXp = Math.round(rewardsBreakdown.xpPerKas * multiplier);

          return (
            <div key={action.step} className="relative">
              {index < actionsWithCalculatedCosts.length - 1 && (
                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />
              )}

              <div className="relative flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{action.step}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      {action.action}
                      {isVariable && (
                        <span className="font-normal text-zinc-600 dark:text-zinc-400"> — you pay the amount you enter (fee applies)</span>
                      )}
                    </div>
                    {!isVariable && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Cost: <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatPrice(totalCostWithFee)} {nativeSymbol}
                            {calculatedCost?.feePercent != null && calculatedCost.feePercent > 0 && (
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
                    )}
                  </div>

                  {isVariable ? (
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Rewards ≈ {formatLargeNumber(rewardsPerKasGrid)} {gridLabel} + {formatLargeNumber(rewardsPerKasXp)} XP per 1 {nativeSymbol}
                        {multiplier > 1 && <span className="text-green-600 dark:text-green-400"> (×{multiplier} tier)</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1.5">Rewards</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600 dark:text-zinc-400">{gridLabel}</span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatLargeNumber(adjustedRewards.grid)}
                            {multiplier > 1 && <span className="ml-1 text-green-600 dark:text-green-400">({multiplier}x)</span>}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600 dark:text-zinc-400">XP</span>
                          <span className="font-medium text-[#02abb8]">
                            {formatLargeNumber(adjustedRewards.xp)}
                            {multiplier > 1 && <span className="ml-1 text-green-600 dark:text-green-400">({multiplier}x)</span>}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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

      {/* Total Predicted Rewards — hide for single-step variable-amount flow */}
      {actionsWithCalculatedCosts.length > 1 || !hasVariableAmountStep ? (
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
                <span className="text-zinc-600 dark:text-zinc-400">Total {gridLabel}</span>
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
      ) : null}
    </div>
  );
}

