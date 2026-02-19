'use client';

import { useMemo } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { formatEther, formatUnits } from 'viem';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { generateDAppSlug } from '@/lib/utils';
import { unifiedToRevenueTreeData } from '@/lib/revenue-tree/utils';
import { getCurrentReferrer } from '@/lib/revenue-tree/referral';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { useSetReferrer } from '@/hooks/useSetReferrer';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { calculateCost, type CostBreakdown } from '@/lib/payments/calculator';

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

  const networkType = getDAppNetworkType(dapp);
  const isL2 = networkType === 'L2';

  const { tree: unifiedTree } = useRevenueTree();
  const { setReferrer, isPending: setReferrerPending, isConfirming: setReferrerConfirming, isSupported: setReferrerSupported } = useSetReferrer();
  const pendingReferrer = typeof window !== 'undefined' ? getCurrentReferrer() : null;

  const revenueTreeData = useMemo(() => {
    const data = unifiedToRevenueTreeData(unifiedTree ?? null);
    if (data) return data;
    return generateMockRevenueTree(dapp.id, slug, userWalletAddress ?? undefined, chainId, false);
  }, [unifiedTree, dapp.id, slug, userWalletAddress, chainId]);

  const activationAmount = useMemo(() => {
    if (!unifiedTree?.lifetimeVolume) return 0;
    return parseFloat(formatEther(BigInt(unifiedTree.lifetimeVolume)));
  }, [unifiedTree?.lifetimeVolume]);

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
      });
      
      return {
        actionId: action.actionId,
        actionName: action.actionName,
        costBreakdown,
      };
    });
  }, [paymentConfig, dapp, krexBalance, tier, nftStatus, isConnected]);

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
          {pendingReferrer && !unifiedTree?.referrerSet && setReferrerSupported && userWalletAddress && (
            <div className="mb-4 p-3 bg-[#02abb8]/10 border border-[#02abb8]/30 rounded-lg">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                Set your referrer once to join the tree: <span className="font-mono text-xs">{pendingReferrer.slice(0, 10)}…{pendingReferrer.slice(-8)}</span>
              </p>
              <button
                type="button"
                onClick={() => setReferrer(pendingReferrer as `0x${string}`)}
                disabled={setReferrerPending || setReferrerConfirming}
                className="px-3 py-1.5 bg-[#02abb8] hover:bg-[#0299a6] text-white text-sm font-bold rounded-lg disabled:opacity-50"
              >
                {setReferrerPending || setReferrerConfirming ? 'Confirm in wallet…' : 'Set referrer'}
              </button>
            </div>
          )}
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
