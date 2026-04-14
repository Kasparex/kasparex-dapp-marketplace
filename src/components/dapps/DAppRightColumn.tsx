'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, getDAppNetworkType } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { DAppActionsColumn } from './DAppActionsColumn';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { getChainById } from '@/lib/wagmi';

interface DAppRightColumnProps {
  dapp: DApp;
  contractAddress?: string;
}

/**
 * Premium right column: Meta row (category, version, ID, modals, star/heart) → Title → Reward tokens → Description (clickable → info modal) → Actions/Purchase box.
 */
export function DAppRightColumn({ dapp, contractAddress: propContractAddress }: DAppRightColumnProps) {
  const chainId = useChainId();
  const mergedDApp = mergeDAppData(null, dapp);

  let resolvedContractAddress = propContractAddress || mergedDApp.contractAddress || '';
  if (!resolvedContractAddress) {
    resolvedContractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
  }
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress?.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  const category = getCategoryById(mergedDApp.category);
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';
  const networkType = getDAppNetworkType(mergedDApp);

  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = Boolean(chain?.testnet);
  const dAppRewards = useMemo(() => {
    const config = getDAppPaymentConfig(mergedDApp, networkType);
    const rewards = getDefaultRewardsBreakdown(chainId);
    const firstAction = config?.actions?.[0];
    const baseCost = firstAction?.baseCost ?? 1;
    const gridReward = Math.round(rewards.grtPerKas * baseCost);
    const xpReward = Math.round(rewards.xpPerKas * baseCost);
    const gridLabel = isTestnet ? 'tGRID' : 'GRID';
    return { gridReward, xpReward, gridLabel };
  }, [mergedDApp, networkType, chainId, isTestnet]);

  let rawTicker: string | null = null;
  if (isL1DApp) {
    if (mergedDApp.slug === 'send-kas' || mergedDApp.name.toLowerCase().includes('send kas')) {
      rawTicker = 'KAS';
    } else if (mergedDApp.slug === 'send-krex' || mergedDApp.name.toLowerCase().includes('send krex')) {
      rawTicker = 'KREX';
    }
  } else {
    rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
  }
  const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;

  const featured = mergedDApp.featuredImage || mergedDApp.image || '';

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Featured image moved here (from widget header). */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {featured ? (
          <div className="relative aspect-[3/2] w-full">
            <Image
              src={featured}
              alt={`${mergedDApp.name} - Featured image`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="relative aspect-[3/2] w-full flex items-center justify-center">
            <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Actions, Costs & Fees */}
      <DAppActionsColumn dapp={dapp} contractAddress={propContractAddress} />
    </div>
  );
}
