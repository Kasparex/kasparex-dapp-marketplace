'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { DAppRewardsSidebar } from '../rewards/DAppRewardsSidebar';
import { DAppActionFlow } from './DAppActionFlow';
import { NetworkAvailabilityBox } from './NetworkAvailabilityBox';
import { getDAppNetworkType } from '@/lib/dapps';

interface DAppPageFooterProps {
  dapp: DApp;
}

export function DAppPageFooter({ dapp }: DAppPageFooterProps) {
  const chainId = useChainId();
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

  // Check if this is an L1 dApp
  const isL1DApp = getDAppNetworkType(dapp) === 'L1';

  let contractAddress = '';
  if (!isL1DApp) {
    contractAddress = dapp.contractAddress || getDAppContractAddress(dapp, chainId) || '';
  }

  // Fetch contract data to get deployer address (only for L2 dApps)
  const { data: contractData } = useDAppFromContract(
    !isL1DApp && contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined,
    chainId
  );

  // Merge localStorage data
  const mergedDApp = mergeDAppData(contractData, dapp);
  
  // Get token ticker from contract data (only for L2 dApps)
  const tokenTicker = !isL1DApp ? (contractData?.ticker || null) : null;

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
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative">
      {/* Collapse Button */}
      <button
        onClick={() => setIsFooterCollapsed(true)}
        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white transition-colors z-10"
        aria-label="Collapse footer"
        title="Collapse footer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Footer Content */}
      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Network Availability */}
            <div>
              <NetworkAvailabilityBox dapp={mergedDApp} />
            </div>

            {/* Action Flow - GRT-only */}
            <div>
              <DAppActionFlow dapp={mergedDApp} />
            </div>

            {/* Rewards Sidebar - GRT-only */}
            <div>
              <DAppRewardsSidebar dappName={mergedDApp.name} />
            </div>
          </div>

          {/* Footer Text - Centered */}
          <div className="text-center pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-500">
              <Link
                href="/"
                className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                title="The Largest dApp Marketplace on Kaspa. Explore, Build, and Earn Today."
              >
                Kasparex dApps
              </Link>
              {' '}| Built with ❤️ by{' '}
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
          </div>
        </div>
      </div>
    </div>
  );
}
