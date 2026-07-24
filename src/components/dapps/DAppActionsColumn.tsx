'use client';

import { useMemo } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { usePaymentAmount } from '@/lib/dapps/PaymentAmountContext';
import { formatUnits } from 'viem';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useGRIDToken } from '@/hooks/useGRIDToken';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { calculateCost, formatPrice, type CostBreakdown } from '@/lib/payments/calculator';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface DAppActionsColumnProps {
  dapp: DApp;
  contractAddress?: string;
}

/** Format number for display (integers without decimals, decimals trimmed). */
function formatFee(value: number): string {
  if (value >= 1_000_000) {
    const v = value / 1_000_000;
    return Number.isInteger(v) ? `${v}M` : `${v.toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (value >= 1_000) {
    const v = value / 1_000;
    return Number.isInteger(v) ? `${v}K` : `${v.toFixed(2).replace(/\.?0+$/, '')}K`;
  }
  if (value >= 1) return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '') || '0';
  if (value > 0) return value.toFixed(4).replace(/\.?0+$/, '') || '0';
  return '0';
}

export function DAppActionsColumn({ dapp, contractAddress }: DAppActionsColumnProps) {
  const { address: userWalletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const { paymentAmount } = usePaymentAmount();

  const networkType = getDAppNetworkType(dapp);

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

  // Calculate costs for each action. For variable-amount dApps (e.g. Simple Payment), use payment amount from context.
  const actionCosts = useMemo(() => {
    if (!paymentConfig || !isConnected) return [];
    
    return paymentConfig.actions.map(action => {
      const isVariableAmount = !!action.variableAmount;
      const overrideBaseCost = isVariableAmount && paymentAmount != null && paymentAmount > 0 ? paymentAmount : undefined;
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
        overrideBaseCost,
      });
      
      return {
        actionId: action.actionId,
        actionName: action.actionName,
        costBreakdown,
        variableAmount: isVariableAmount,
      };
    });
  }, [paymentConfig, dapp, krexBalance, tier, nftStatus, isConnected, paymentAmount]);

  const nativeFormatted = nativeBalance
    ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals))
    : 0;

  // KREX discount from balance (Tier4 100M+ = 15%, Tier3 50M+ = 10%, Tier2 10M+ = 5%, Tier1 = 0%)
  const krexDiscountPercent =
    krexBalance >= 100_000_000 ? 15 : krexBalance >= 50_000_000 ? 10 : krexBalance >= 10_000_000 ? 5 : 0;
  const nftDiscountPercent = 0; // TODO: NFT holder check
  const nodeDiscountPercent = 0; // TODO: NODE holder check

  // User Balances: GRID/tGRID token address for this chain
  const gridTokenAddress = useMemo(() => {
    const tgrid = getContractAddress(chainId, 'tGRID');
    if (tgrid) return tgrid;
    return getContractAddress(chainId, 'GRIDToken') || null;
  }, [chainId]);
  const isTestnet = chainId === 167012 || chainId === 38836;
  const gridLabel = isTestnet ? 'tGRID' : 'GRID';
  const krexLabel = isTestnet ? 'tKREX' : 'KREX';
  const nativeLabel = chainId === 38833 || chainId === 38836 ? 'iKAS' : (nativeBalance?.symbol || nativeSymbol);
  const { balance: gridBalanceWei, formattedBalance: gridFormattedBalance, isLoading: gridLoading, totalSupply: gridTotalSupply, maxSupply: gridMaxSupply } = useGRIDToken(gridTokenAddress);
  const { totalRedeemable: hubPts, address: hubAddr } = useRedeemablePointsBreakdown();
  const gridBalanceNum = gridBalanceWei != null ? Number(gridBalanceWei) / 1e18 : 0;

  const gridProgress = useMemo(() => {
    if (!gridTotalSupply || !gridMaxSupply || gridMaxSupply === 0n) return null;
    const pct = Number((gridTotalSupply * 10000n) / gridMaxSupply) / 100;
    return Math.min(100, pct);
  }, [gridTotalSupply, gridMaxSupply]);

  const balanceRows = useMemo(() => {
    const rows: { token: string; balance: string; loading?: boolean }[] = [];
    rows.push({
      token: 'Hub pts',
      balance: !hubAddr ? 'Connect Kaspa L1' : hubPts.toLocaleString(),
      loading: false,
    });
    rows.push({
      token: nativeLabel,
      balance: isConnected ? formatFee(nativeFormatted) : '-',
      loading: false,
    });
    rows.push({
      token: krexLabel,
      balance: !isConnected ? '-' : krexLoading ? '...' : formatLargeNumber(krexBalance),
      loading: krexLoading,
    });
    rows.push({
      token: gridLabel,
      balance: !isConnected ? '-' : gridLoading ? '...' : formatLargeNumber(gridBalanceNum),
      loading: gridLoading,
    });
    return rows;
  }, [isConnected, hubAddr, hubPts, nativeLabel, nativeFormatted, krexLabel, krexBalance, krexLoading, gridLabel, gridBalanceNum, gridLoading]);

  return (
    <HubAsideRail adSlotId="HALO_DAPPS_RIGHT" adId="ad-slot-dapp-actions-rail">
      {/* User Balances - simple TOKEN ---- balance containers */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
          User Balances
        </h3>
        <div className="space-y-2">
          {balanceRows.map(({ token, balance, loading }) => (
            <div
              key={token}
              className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
            >
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{token}</span>
              <span className="text-base font-semibold tabular-nums text-[#02abb8]">
                {loading ? '...' : balance}
              </span>
            </div>
          ))}
        </div>
        {/* tGRID/GRID supply progress bar */}
        {gridTokenAddress && gridProgress != null && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span>{gridLabel} supply</span>
              <span>{Number.isInteger(gridProgress) ? gridProgress : gridProgress.toFixed(1)}% minted</span>
            </div>
            <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#02abb8] rounded-full transition-all"
                style={{ width: `${gridProgress}%` }}
              />
            </div>
          </div>
        )}
        {/* 95% / 5% treasury split info */}
        {gridTokenAddress && (
          <p className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            {gridLabel} rewards: 95% to you, 5% to treasury.
          </p>
        )}
        {/* Base reward calculation info (L2 testnet) */}
        {(chainId === 38836 || chainId === 38833) && (
          <p className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            Base: 1 {nativeLabel} = 500 {gridLabel}; Kaspa redeemable pts accrue via Hub Rewards (same wallet). Hold {krexLabel} on this network for tier multiplier.{' '}
            <a href="https://katbridge.com/" target="_blank" rel="noopener noreferrer" className="text-[#02abb8] hover:underline">KAT Bridge ↗</a>
          </p>
        )}
      </div>
    </HubAsideRail>
  );
}
