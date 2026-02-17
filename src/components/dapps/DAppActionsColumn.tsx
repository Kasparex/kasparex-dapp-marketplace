'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { generateDAppSlug } from '@/lib/utils';
import { hasUserActivated } from '@/lib/revenue-tree/utils';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { formatUnits } from 'viem';

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
  const { balance: krexBalance, isLoading: krexLoading } = useKREXBalance();

  const revenueTreeData = generateMockRevenueTree(
    dapp.id,
    slug,
    userWalletAddress,
    chainId,
    userWalletAddress ? hasUserActivated(userWalletAddress, 'dapp', slug) : false
  );

  useEffect(() => {
    if (userWalletAddress && typeof window !== 'undefined') {
      const key = `revenue_tree_spent:${dapp.id}:${userWalletAddress}`;
      const spent = localStorage.getItem(key);
      if (spent) setActivationAmount(parseFloat(spent));
    }
  }, [userWalletAddress, dapp.id]);

  // Base cost from dApp / Revenue Tree (e.g. 100 KAS activation)
  const baseCostKas = 100;
  const networkFeeKas = 0.001;
  // KREX discount from balance (Tier4 100M+ = 15%, Tier3 50M+ = 10%, Tier2 10M+ = 5%, Tier1 = 0%)
  const krexDiscountPercent =
    krexBalance >= 100_000_000 ? 15 : krexBalance >= 50_000_000 ? 10 : krexBalance >= 10_000_000 ? 5 : 0;
  const nftDiscountPercent = 0; // TODO: NFT holder check
  const nodeDiscountPercent = 0; // TODO: NODE holder check
  const totalDiscountPercent = Math.min(25, krexDiscountPercent + nftDiscountPercent + nodeDiscountPercent);
  const discountMultiplier = 1 - totalDiscountPercent / 100;
  const totalKas = (baseCostKas + networkFeeKas) * discountMultiplier;

  const nativeFormatted = nativeBalance
    ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals))
    : 0;

  return (
    <div className="space-y-6">
      {/* Fees & Revenue Share - integrated with wallet and Revenue Tree */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h3 className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-4">
          Fees & Revenue Share
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Base cost</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{baseCostKas} KAS</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Network fee</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">~{networkFeeKas} KAS</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">KREX</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {!isConnected ? '—' : krexLoading ? '...' : `${formatFee(krexBalance)} (${krexDiscountPercent}% off)`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">NFTs</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{nftDiscountPercent ? `${nftDiscountPercent}% off` : '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">NODE</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{nodeDiscountPercent ? `${nodeDiscountPercent}% off` : '—'}</span>
          </div>
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Total</span>
              <span className="text-lg font-black text-[#02abb8]">{totalKas.toFixed(3)} KAS</span>
            </div>
          </div>
          {isConnected && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
              Your balance: {formatFee(nativeFormatted)} {nativeBalance?.symbol || 'KAS'}
            </p>
          )}
        </div>
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
