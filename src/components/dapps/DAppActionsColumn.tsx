'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { generateDAppSlug } from '@/lib/utils';
import { hasUserActivated, markUserActivated } from '@/lib/revenue-tree/utils';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { formatUnits } from 'viem';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { calculateCost, type CostBreakdown } from '@/lib/payments/calculator';
import { getStoredTransactions } from '@/lib/transactions/tracker';

interface DAppActionsColumnProps {
  dapp: DApp;
  contractAddress?: string;
}

/** Format number for display (compact). */
function formatFee(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return value.toFixed(2);
  if (value > 0) return value.toFixed(4);
  return '0';
}

export function DAppActionsColumn({ dapp, contractAddress }: DAppActionsColumnProps) {
  const { address: userWalletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const slug = dapp.slug || generateDAppSlug(dapp.name);
  const [activationAmount, setActivationAmount] = useState(0);

  const networkType = getDAppNetworkType(dapp);
  const isL2 = networkType === 'L2';

  // Connected wallet balances for real fee/reward display
  const { data: nativeBalance } = useBalance({
    address: userWalletAddress,
  });
  const { balance: krexBalance, tier, isLoading: krexLoading } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  // Get payment config for this dApp
  const paymentConfig = useMemo(() => {
    return getDAppPaymentConfig(dapp, networkType);
  }, [dapp, networkType]);

  // Calculate costs for each action
  const actionCosts = useMemo(() => {
    if (!paymentConfig || !isConnected) return [];
    
    return paymentConfig.actions.map(action => {
      const costBreakdown = calculateCost({
        dapp,
        actionId: action.actionId,
        krexBalance: krexBalance || 0,
        krexTier: tier,
        hasAnyNFT: !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
          (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(v => v))),
        hasDiamondNFT: !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
          (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(v => v))),
        hasRarestNFT: !!nftStatus?.hasRarestNFT,
        isNodeProvider: false, // TODO: Get from node status hook
        nodeFeeReduction: 0,
        nodeCostReduction: 0,
      });
      
      return {
        actionId: action.actionId,
        actionName: action.actionName,
        costBreakdown,
      };
    });
  }, [paymentConfig, dapp, krexBalance, tier, nftStatus, isConnected]);

  // Calculate total spent for Revenue Tree activation from stored transactions
  useEffect(() => {
    if (!userWalletAddress || typeof window === 'undefined') {
      setActivationAmount(0);
      return;
    }

    const transactions = getStoredTransactions();
    const dappTransactions = transactions.filter(
      tx => tx.dAppId === dapp.id && tx.userAddress.toLowerCase() === userWalletAddress.toLowerCase() && tx.status === 'confirmed'
    );
    
    const totalSpent = dappTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    setActivationAmount(totalSpent);

    // Mark as activated if >= 100 KAS spent
    if (totalSpent >= 100 && !hasUserActivated(userWalletAddress, 'dapp', slug)) {
      markUserActivated(userWalletAddress, 'dapp', slug);
    }
  }, [userWalletAddress, dapp.id, slug]);

  const revenueTreeData = generateMockRevenueTree(
    dapp.id,
    slug,
    userWalletAddress,
    chainId,
    userWalletAddress ? hasUserActivated(userWalletAddress, 'dapp', slug) : false
  );

  const nativeFormatted = nativeBalance
    ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals))
    : 0;

  // KREX discount from balance (Tier4 100M+ = 15%, Tier3 50M+ = 10%, Tier2 10M+ = 5%, Tier1 = 0%)
  const krexDiscountPercent =
    krexBalance >= 100_000_000 ? 15 : krexBalance >= 50_000_000 ? 10 : krexBalance >= 10_000_000 ? 5 : 0;
  const nftDiscountPercent = 0; // TODO: NFT holder check
  const nodeDiscountPercent = 0; // TODO: NODE holder check

  return (
    <div className="space-y-6">
      {/* Fees & Revenue Share - dynamic per dApp with real actions */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-2 py-2 border-b border-zinc-100 dark:border-zinc-800">
          Fees & Rewards
        </h3>
        
        {actionCosts.length > 0 ? (
          <div className="space-y-4">
            {actionCosts.map(({ actionId, actionName, costBreakdown }) => (
              <div key={actionId} className="space-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{actionName}</span>
                </div>
                <div className="space-y-1.5 pl-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Base cost</span>
                    <span>{costBreakdown.baseCost.toFixed(2)} KAS</span>
                  </div>
                  {costBreakdown.costReductionPercent > 0 && (
                    <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                      <span>Cost reduction</span>
                      <span>-{costBreakdown.costReductionPercent.toFixed(1)}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Fee ({costBreakdown.feePercent.toFixed(2)}%)</span>
                    <span>{costBreakdown.feeAmount.toFixed(4)} KAS</span>
                  </div>
                  {costBreakdown.feePercent < 1.0 && (
                    <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                      <span>Fee reduction</span>
                      <span>-{(1.0 - costBreakdown.feePercent).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
                {/* Total moved below calculations */}
                <div className="pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Total</span>
                    <span className="text-base font-black text-[#02abb8]">{costBreakdown.finalCostWithFee.toFixed(3)} KAS</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Discount summary */}
            {(krexDiscountPercent > 0 || nftDiscountPercent > 0 || nodeDiscountPercent > 0) && (
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>KREX discount</span>
                  <span>{krexDiscountPercent > 0 ? `${krexDiscountPercent}%` : '—'}</span>
                </div>
                {nftDiscountPercent > 0 && (
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>NFT discount</span>
                    <span>{nftDiscountPercent}%</span>
                  </div>
                )}
                {nodeDiscountPercent > 0 && (
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>NODE discount</span>
                    <span>{nodeDiscountPercent}%</span>
                  </div>
                )}
              </div>
            )}
            
            {isConnected && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                Your balance: {formatFee(nativeFormatted)} {nativeBalance?.symbol || 'KAS'}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Base cost</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">1.0 KAS</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Network fee</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">~0.001 KAS</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">KREX</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {!isConnected ? '—' : krexLoading ? '...' : `${formatFee(krexBalance)} (${krexDiscountPercent}% off)`}
              </span>
            </div>
            {/* Total moved below calculations */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Total</span>
                <span className="text-lg font-black text-[#02abb8]">~1.001 KAS</span>
              </div>
            </div>
            {isConnected && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                Your balance: {formatFee(nativeFormatted)} {nativeBalance?.symbol || 'KAS'}
              </p>
            )}
          </div>
        )}
      </div>

      {isL2 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <RevenueTree
            data={revenueTreeData}
            userWalletAddress={userWalletAddress || undefined}
            isL2Only={true}
            activationAmount={activationAmount}
          />
        </div>
      )}
    </div>
  );
}
