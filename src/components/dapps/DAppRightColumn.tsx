'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, getDAppNetworkType, isDirectoryListingDApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { DAppActionsColumn } from './DAppActionsColumn';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useDAppXpReward } from '@/hooks/useDAppXpReward';
import { DAppIcon } from './DAppIcon';
import { DAppInfoModal } from './DAppInfoModal';

interface DAppRightColumnProps {
  dapp: DApp;
  contractAddress?: string;
  hideRevenueTree?: boolean;
}

/**
 * Premium right column: Meta row (category, version, ID, modals, star/heart) → Title → Reward tokens → Description (clickable → info modal) → Actions/Purchase box.
 */
export function DAppRightColumn({ dapp, contractAddress: propContractAddress, hideRevenueTree = false }: DAppRightColumnProps) {
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

  const xpReward = useDAppXpReward(mergedDApp);

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
  const description = mergedDApp.utility || mergedDApp.description || mergedDApp.process || '';
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Featured image opens dApp info modal */}
      <button
        type="button"
        onClick={() => setShowInfoModal(true)}
        className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-100 dark:bg-zinc-900 w-full text-left cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02abb8]"
        aria-label={`View ${mergedDApp.name} details`}
      >
        {featured ? (
          <div className="relative aspect-video w-full">
            <Image
              src={featured}
              alt={`${mergedDApp.name} - Featured image`}
              fill
              className="object-cover transition-opacity group-hover:opacity-90"
              unoptimized
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full flex items-center justify-center">
            <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </button>

      {/* Logo + Title */}
      <div className="flex items-start gap-4">
        <DAppIcon
          dAppName={mergedDApp.name}
          category={mergedDApp.category}
          size={64}
          className="flex-shrink-0 rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
            {mergedDApp.name}
          </h1>
          <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 mt-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">
              {isDirectoryListingDApp(mergedDApp) ? 'N/A' : `${formatLargeNumber(xpReward)} pts`}
            </span>
          </div>
        </div>
      </div>

      {/* Clickable description (opens Info modal) */}
      <div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm lg:text-base leading-relaxed line-clamp-5">
          {description || 'No description available.'}
        </p>
        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="mt-2 text-sm font-medium text-[#02abb8] hover:text-[#0299a6] dark:hover:text-[#02abb8] transition-colors inline-flex items-center gap-1"
        >
          Read more
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Actions, Costs & Fees */}
      <DAppActionsColumn dapp={dapp} contractAddress={propContractAddress} hideRevenueTree={hideRevenueTree} />

      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={resolvedContractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </div>
  );
}
