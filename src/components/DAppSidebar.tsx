'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { isDeployer } from '@/lib/dapps/deployer';
import { useDAppFromContract } from '@/lib/dapps/contractData';
// Edit functionality removed - dApps are now read-only
import { getContractAddress } from '@/lib/contracts/addresses';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { DAppRewardsSidebar } from './rewards/DAppRewardsSidebar';
import { LRTHoldingsBox } from './rewards/LRTHoldingsBox';

interface DAppSidebarProps {
  dapp: DApp;
}

// Helper function to get icon based on link label or URL
const getLinkIcon = (label: string, url: string) => {
  const lowerLabel = label.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (lowerLabel.includes('website') || lowerLabel.includes('site') || (!lowerUrl.includes('t.me') && !lowerUrl.includes('twitter') && !lowerUrl.includes('x.com') && !lowerUrl.includes('github'))) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    );
  }
  if (lowerLabel.includes('telegram') || lowerUrl.includes('t.me')) {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.226-.46-1.9-.902-1.056-.69-1.653-1.12-2.678-1.794-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }
  if (lowerLabel.includes('twitter') || lowerLabel.includes('x') || lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (lowerLabel.includes('github') || lowerUrl.includes('github.com')) {
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    );
  }
  // Default icon (link/external)
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
};

export function DAppSidebar({ dapp }: DAppSidebarProps) {
  const { address: connectedAddress } = useAccount();
  const chainId = useChainId();
  // Edit functionality removed

  // Get contract address
  let contractAddress = dapp.contractAddress || '';
  if (!contractAddress && dapp.slug === 'simple-payment') {
    try {
      contractAddress = getContractAddress(chainId, 'SimplePayment') || '';
    } catch (e) {
      console.warn('Could not get SimplePayment contract address');
    }
  }

  // Fetch contract data to get deployer address
  const { data: contractData } = useDAppFromContract(
    contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined,
    chainId
  );

  const deployerAddress = contractData?.deployerAddress || dapp.deployerAddress || dapp.developer || '';
  const isDeployerUser = isDeployer(connectedAddress, deployerAddress);
  
  // Merge localStorage data
  const mergedDApp = mergeDAppData(contractData, dapp);
  
  // Get token ticker from contract data
  const tokenTicker = contractData?.ticker || null;

  return (
    <>
      {/* Mobile Back Button */}
      <div className="lg:hidden px-4 pt-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Categories
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
          <div className="p-4 lg:p-6">
            {/* Back to Categories Button and Edit Button */}
            <div className="mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Categories
              </Link>
              
              {/* Edit functionality removed - dApps are now read-only */}
            </div>

            {/* Featured Image */}
            <div className="mb-6">
              <div 
                className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              >
                {mergedDApp.featuredImage ? (
                  <Image
                    src={mergedDApp.featuredImage}
                    alt={mergedDApp.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-zinc-400 dark:text-zinc-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {isDeployerUser && (
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {mergedDApp.featuredImage ? 'Edit' : 'Upload'}
                  </div>
                )}
              </div>
            </div>

            {/* LRT Holdings */}
            <LRTHoldingsBox tokenTicker={tokenTicker} />

            {/* Rewards Sidebar */}
            <DAppRewardsSidebar 
              tokenTicker={tokenTicker}
              dappName={mergedDApp.name}
            />
          </div>
        </div>
      </aside>

      {/* Edit functionality removed - dApps are now read-only */}
    </>
  );
}

