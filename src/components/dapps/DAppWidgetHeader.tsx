'use client';

import { useState } from 'react';
import { useChainId } from 'wagmi';
import Image from 'next/image';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { DAppInfoModal } from './DAppInfoModal';

interface DAppWidgetHeaderProps {
  dapp: DApp;
  contractAddress?: string;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideInfo?: boolean;
  hideEmbed?: boolean;
  accentColor?: string;
}

export function DAppWidgetHeader({ 
  dapp, 
  contractAddress,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideInfo = false,
  hideEmbed = false,
  accentColor = '#02abb8',
}: DAppWidgetHeaderProps) {
  const chainId = useChainId();

  let resolvedContractAddress = contractAddress || dapp.contractAddress || '';
  if (!resolvedContractAddress) {
    resolvedContractAddress = getDAppContractAddress(dapp, chainId) || '';
  }
  
  // Fetch contract data
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  // Merge contract data
  const mergedDApp = mergeDAppData(contractData, dapp);

  // Modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  /** Show/hide only the featured image section (toggle is the small button on the image). */
  const [showFeaturedImage, setShowFeaturedImage] = useState(true);

  return (
    <>
      {/* Featured Image Banner - Show/hide only the image section */}
      {mergedDApp.featuredImage || mergedDApp.image ? (
        showFeaturedImage ? (
          <div className="relative w-full h-32 overflow-hidden border-b border-zinc-200 dark:border-zinc-700">
            <Image
              src={mergedDApp.featuredImage || mergedDApp.image || ''}
              alt={`${mergedDApp.name} - Featured image`}
              fill
              className="object-cover"
              unoptimized
            />
            {/* Network Badge - Top Left */}
            {(() => {
              const networkType = getDAppNetworkType(mergedDApp);
              const networkBadgeColor =
                networkType === 'L1'
                  ? 'bg-[#02abb8]/20 dark:bg-[#02abb8]/30 text-[#02abb8] border-[#02abb8]/30 dark:border-[#02abb8]/50'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
              return (
                <span
                  className={`absolute top-2 left-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm border ${networkBadgeColor} z-20 shadow-sm`}
                  title={`${mergedDApp.name} is deployed on ${networkType === 'L1' ? 'Kaspa Layer 1' : 'Kasplex/Igra Layer 2'} network`}
                  aria-label={`Network type: ${networkType}`}
                >
                  {networkType === 'L1' ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  )}
                  {networkType}
                </span>
              );
            })()}
            {/* Hide image button - only for featured image */}
            <button
              onClick={() => setShowFeaturedImage(false)}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white transition-colors z-10"
              aria-label="Hide featured image"
              title="Hide featured image"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFeaturedImage(true)}
            className="w-full px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            aria-label="Show featured image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Show featured image
          </button>
        )
      ) : (
        <div className="relative w-full h-32 bg-zinc-100/80 dark:bg-zinc-900/95 flex items-center justify-center border-b border-zinc-200/50 dark:border-zinc-800/50">
          <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {/* Network Badge - Top Left */}
          {(() => {
            const networkType = getDAppNetworkType(mergedDApp);
            const networkBadgeColor =
              networkType === 'L1'
                ? 'bg-[#02abb8]/20 dark:bg-[#02abb8]/30 text-[#02abb8] border-[#02abb8]/30 dark:border-[#02abb8]/50'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
            return (
              <span
                className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${networkBadgeColor} z-20 shadow-sm`}
                title={`${mergedDApp.name} is deployed on ${networkType === 'L1' ? 'Kaspa Layer 1' : 'Kasplex/Igra Layer 2'} network`}
                aria-label={`Network type: ${networkType}`}
              >
                {networkType === 'L1' ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                )}
                {networkType}
              </span>
            );
          })()}
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={resolvedContractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}

    </>
  );
}
