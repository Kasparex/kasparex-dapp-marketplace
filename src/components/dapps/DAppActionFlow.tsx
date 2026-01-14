'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { getDefaultRewardsBreakdown, getMockWalletHoldings } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { KREX_TIERS } from '@/lib/rewards/types';
import { useKREXBalance } from '@/hooks/useKREXBalance';

interface DAppActionFlowProps {
  dapp: DApp;
  tokenTicker?: string | null;
}

// Get dApp-specific actions and fees
function getDAppActions(dapp: DApp, tokenTicker: string): Array<{
  step: number;
  action: string;
  cost: string;
  costKAS: number;
  baseRewards: {
    grid: number;
    token: number;
    xp: number;
  };
  nextStep?: string;
}> {
  const name = dapp.name.toLowerCase();
  const category = dapp.category.toLowerCase();
  const rewards = getDefaultRewardsBreakdown(tokenTicker);

  // DAO Voting specific actions
  if (name.includes('dao') || name.includes('voting')) {
    return [
      {
        step: 1,
        action: 'Submit Proposal',
        cost: '10 KAS',
        costKAS: 10,
        baseRewards: {
          grid: rewards.grtPerKas * 10,
          token: rewards.lrtPerKas * 10,
          xp: rewards.xpPerKas * 10,
        },
        nextStep: 'Wait for voting period',
      },
      {
        step: 2,
        action: 'Cast Vote',
        cost: '1 KAS',
        costKAS: 1,
        baseRewards: {
          grid: rewards.grtPerKas,
          token: rewards.lrtPerKas,
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
        cost: '5 KAS',
        costKAS: 5,
        baseRewards: {
          grid: rewards.grtPerKas * 5,
          token: rewards.lrtPerKas * 5,
          xp: rewards.xpPerKas * 5,
        },
        nextStep: 'Access content',
      },
      {
        step: 2,
        action: 'Renew Subscription',
        cost: '5 KAS',
        costKAS: 5,
        baseRewards: {
          grid: rewards.grtPerKas * 5,
          token: rewards.lrtPerKas * 5,
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
        cost: '1 KAS + 1% fee',
        costKAS: 1.01,
        baseRewards: {
          grid: rewards.grtPerKas,
          token: rewards.lrtPerKas,
          xp: rewards.xpPerKas,
        },
        nextStep: 'Payment processed',
      },
    ];
  }

  // Quiz-to-Earn specific actions
  if (name.includes('quiz')) {
    return [
      {
        step: 1,
        action: 'Answer Question',
        cost: '0.1 KAS',
        costKAS: 0.1,
        baseRewards: {
          grid: rewards.grtPerKas * 0.1,
          token: rewards.lrtPerKas * 0.1,
          xp: rewards.xpPerKas * 0.1,
        },
        nextStep: 'Check answer',
      },
      {
        step: 2,
        action: 'Correct Answer',
        cost: '0 KAS',
        costKAS: 0,
        baseRewards: {
          grid: rewards.grtPerKas * 0.5,
          token: rewards.lrtPerKas * 0.5,
          xp: rewards.xpPerKas * 0.5,
        },
        nextStep: 'Continue quiz',
      },
    ];
  }

  // Default actions for other dApps
  return [
    {
      step: 1,
      action: 'Use dApp',
      cost: '1 KAS',
      costKAS: 1,
      baseRewards: {
        grid: rewards.grtPerKas,
        token: rewards.lrtPerKas,
        xp: rewards.xpPerKas,
      },
      nextStep: 'Complete action',
    },
  ];
}

export function DAppActionFlow({ dapp, tokenTicker }: DAppActionFlowProps) {
  const { address, isConnected } = useAccount();
  const rewards = getDefaultRewardsBreakdown(tokenTicker || undefined);
  // Use actual token ticker if provided, otherwise use the default from rewards
  const displayTokenTicker = tokenTicker || rewards.tokenTicker;
  const actions = getDAppActions(dapp, displayTokenTicker);
  
  // Get KREX tier and multipliers from real balance
  const { tier, isLoading: isKREXLoading } = useKREXBalance();
  const tierConfig = KREX_TIERS[tier];
  const multiplier = tierConfig.multiplier;
  // feePercent is already a percentage (1.0 = 1%), so calculate reduction from base 1%
  const baseFee = 1.0; // Base fee is 1%
  const feeReduction = baseFee > tierConfig.feePercent ? ((baseFee - tierConfig.feePercent) / baseFee) * 100 : 0;

  // Calculate total predicted rewards if user completes all actions
  const totalPredicted = actions.reduce(
    (acc, action) => ({
      grid: acc.grid + action.baseRewards.grid * multiplier,
      token: acc.token + action.baseRewards.token * multiplier,
      xp: acc.xp + action.baseRewards.xp * multiplier,
      totalCost: acc.totalCost + action.costKAS * (1 - feeReduction / 100),
    }),
    { grid: 0, token: 0, xp: 0, totalCost: 0 }
  );

  // Get wallet holdings
  const holdings = getMockWalletHoldings(address);
  const dAppTokenBalance = holdings?.lrtBalances.find(b => b.ticker === displayTokenTicker)?.balance || 0;

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
                {formatLargeNumber(mockKREXBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">GRID</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {holdings ? formatLargeNumber(holdings.grt) : '0'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">{displayTokenTicker}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(dAppTokenBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">XP</span>
              <span className="font-medium text-[#02abb8]">
                {holdings ? formatLargeNumber(holdings.xp) : '0'}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Tier</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {tierConfig.label} ({multiplier}x)
                </span>
              </div>
              {feeReduction > 0 && (
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-zinc-600 dark:text-zinc-400">Fee Reduction</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    -{feeReduction.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Flow */}
      <div className="space-y-4">
        {actions.map((action, index) => {
          const adjustedRewards = {
            grid: action.baseRewards.grid * multiplier,
            token: action.baseRewards.token * multiplier,
            xp: action.baseRewards.xp * multiplier,
          };
          // Calculate adjusted cost: if feeReduction is 20%, cost is reduced by 20%
          const adjustedCost = feeReduction > 0 
            ? action.costKAS * (1 - feeReduction / 100)
            : action.costKAS;

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
                          {feeReduction > 0 ? (
                            <>
                              <span className="line-through text-zinc-400">{action.cost}</span>
                              <span className="ml-1 text-green-600 dark:text-green-400">
                                {adjustedCost.toFixed(2)} KAS
                              </span>
                            </>
                          ) : (
                            action.cost
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
                        <span className="text-zinc-600 dark:text-zinc-400">{displayTokenTicker}</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {formatLargeNumber(adjustedRewards.token)}
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
                  {totalPredicted.totalCost.toFixed(2)} KAS
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Total GRID</span>
                <span className="font-medium text-[#02abb8]">
                  {formatLargeNumber(totalPredicted.grid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400">Total {displayTokenTicker}</span>
                <span className="font-medium text-[#02abb8]">
                  {formatLargeNumber(totalPredicted.token)}
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

