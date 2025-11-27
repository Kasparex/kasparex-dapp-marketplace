'use client';

import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import Image from 'next/image';
import { DAppIcon } from './DAppIcon';
import { DApp } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { isEmbedded } from '@/lib/utils';
import { StatusIndicator } from './StatusIndicator';
import { getExplorerUrl } from '@/lib/dapps/deployer';

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
  const isEmbeddedPage = isEmbedded();
  
  // Get contract address if not provided
  let resolvedContractAddress = contractAddress || dapp.contractAddress || '';
  if (!resolvedContractAddress && dapp.slug === 'simple-payment') {
    try {
      if (CONTRACT_ADDRESSES) {
        resolvedContractAddress = chainId === 202555
          ? (CONTRACT_ADDRESSES.kasplexL2Mainnet?.SimplePayment || '')
          : chainId === 167012
          ? (CONTRACT_ADDRESSES.kasplexL2Testnet?.SimplePayment || '')
          : '';
      }
    } catch (e) {
      console.warn('Could not get SimplePayment contract address');
    }
  }
  
  // Fetch contract data
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  // Merge contract data
  const mergedDApp = mergeDAppData(contractData, dapp);

  // Short description - priority: description > utility > process (from merged data)
  const shortDescription = mergedDApp.description || mergedDApp.utility || mergedDApp.process || '';
  const truncatedDescription = shortDescription.length > 150 
    ? `${shortDescription.substring(0, 150)}...` 
    : shortDescription;

  // Get token information
  const tokenTicker = contractData?.ticker || null;
  const tokenAddress = contractData?.tokenAddress || null;
  const dAppContractAddress = contractData?.contractAddress || resolvedContractAddress || null;
  
  // Format addresses for display
  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get explorer URLs
  const dAppExplorerUrl = dAppContractAddress ? getExplorerUrl(dAppContractAddress, chainId) : null;
  const tokenExplorerUrl = tokenAddress ? getExplorerUrl(tokenAddress, chainId) : null;

  return (
    <>
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative">
        {/* Status Indicator - Top Right */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-10">
          <StatusIndicator dapp={mergedDApp} size="md" />
        </div>

        {/* Title Section with Featured Image, Icon, and Info */}
        <div className="flex items-start gap-4 mb-4 relative">
          {/* Featured Image */}
          {mergedDApp.featuredImage && (
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <Image
                src={mergedDApp.featuredImage}
                alt={mergedDApp.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          
          <DAppIcon
            dAppName={mergedDApp.name}
            category={mergedDApp.category}
            size={64}
            className="flex-shrink-0"
          />

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {isEmbeddedPage ? (
                <a
                  href={`/dapps/${dapp.slug || dapp.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#02abb8] transition-colors"
                >
                  {mergedDApp.name}
                </a>
              ) : (
                mergedDApp.name
              )}
            </h1>
            {truncatedDescription && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                {truncatedDescription}
              </p>
            )}
            
            {/* dApp and Token Information Rows */}
            {(dAppContractAddress || tokenAddress) && (
              <div className="space-y-1.5 mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
                {/* dApp Row */}
                {dAppContractAddress && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-500 font-medium min-w-[60px]">dApp:</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">{mergedDApp.name}</span>
                    {dAppExplorerUrl && (
                      <a
                        href={dAppExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono ml-auto transition-colors"
                        title={dAppContractAddress}
                      >
                        {formatAddress(dAppContractAddress)}
                      </a>
                    )}
                  </div>
                )}
                
                {/* Token Row */}
                {tokenAddress && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-500 font-medium min-w-[60px]">Token:</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">
                      {tokenTicker || 'N/A'}
                    </span>
                    {tokenExplorerUrl && (
                      <a
                        href={tokenExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono ml-auto transition-colors"
                        title={tokenAddress}
                      >
                        {formatAddress(tokenAddress)}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
      {/* Edit functionality removed - dApps are now read-only */}
    </>
  );
}
