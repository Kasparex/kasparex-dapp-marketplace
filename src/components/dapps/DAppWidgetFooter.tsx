'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { getCategoryById } from '@/lib/categories';
import { getDAppNetworkType } from '@/lib/dapps';
import { generateSimulatedTicker, generateSimulatedAddress } from '@/lib/dapps';

interface DAppWidgetFooterProps {
  dapp: DApp;
  contractAddress?: string;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideEmbed?: boolean;
  /** When true, do not render the category/version/ID/modal/star/heart row (used on dApp page where that row lives in the right column). */
  hideMetaRow?: boolean;
}

export function DAppWidgetFooter({ 
  dapp, 
  contractAddress,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideEmbed = false,
  hideMetaRow = false,
}: DAppWidgetFooterProps) {
  const chainId = useChainId();
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

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
  const category = getCategoryById(mergedDApp.category);

  // Check if this is an L1 dApp
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';

  // Get token information
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

  if (isFooterCollapsed) {
    return (
      <button
        onClick={() => setIsFooterCollapsed(false)}
        className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        aria-label="Expand footer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        Show footer
      </button>
    );
  }

  return (
    <>
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex flex-col gap-4">
          {/* Footer Text and Collapse Button Row */}
          <div className="flex items-center justify-between">
            {/* Footer Text - Aligned Left */}
            <div className="text-xs text-zinc-500 dark:text-zinc-500 text-left flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href="https://hub.kasparex.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                title="Kasparex Hub"
              >
                Kasparex Hub
              </Link>

              {!hideMetaRow ? (
                <>
                  {category ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      <span className="text-[11px] leading-none">{category.emoji}</span>
                      {category.name}
                    </span>
                  ) : null}
                  {mergedDApp.version && mergedDApp.version !== 'N/A' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                      v{mergedDApp.version.replace(/^v\s*/i, '')}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                    {mergedDApp.id}
                  </span>
                </>
              ) : null}

              <span className="opacity-60">|</span>
              <span>Built with love by</span>{' '}
              <Link
                href="https://bio.kasparex.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                title="Symbol of intelligence, resilience, and purpose. Fair-launched, community-owned KRC-20 and L2 token on the Kaspa network.

Est. 2024 🔥"
              >
                Krex
              </Link>
            </div>
            
            {/* Collapse Button - Right (under star/heart icons) */}
            <button
              onClick={() => setIsFooterCollapsed(true)}
              className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white transition-colors"
              aria-label="Collapse footer"
              title="Collapse footer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
