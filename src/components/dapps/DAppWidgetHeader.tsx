'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import Image from 'next/image';
import Link from 'next/link';
import { DAppIcon } from './DAppIcon';
import { DApp, generateSimulatedTicker, generateSimulatedAddress, getDAppNetworkType } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { isEmbedded } from '@/lib/utils';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { getCategoryById } from '@/lib/categories';
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
  const { address: connectedAddress, isConnected } = useAccount();
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
  const category = getCategoryById(mergedDApp.category);

  // Short description - priority: description > utility > process (from merged data)
  const shortDescription = mergedDApp.description || mergedDApp.utility || mergedDApp.process || '';

  // Check if this is an L1 dApp
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';

  // Get token information
  // For L1 dApps, use special token mappings (Send KAS -> KAS, Send KREX -> KREX)
  // For L2 dApps, use contract data or generate simulated ticker
  let rawTicker: string | null = null;
  if (isL1DApp) {
    // L1 dApps: map to actual tokens
    if (mergedDApp.slug === 'send-kas' || mergedDApp.name.toLowerCase().includes('send kas')) {
      rawTicker = 'KAS';
    } else if (mergedDApp.slug === 'send-krex' || mergedDApp.name.toLowerCase().includes('send krex')) {
      rawTicker = 'KREX';
    }
  } else {
    // L2 dApps: use contract data or generate
    rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
  }
  const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;
  const tokenAddress = !isL1DApp ? (contractData?.tokenAddress || (tokenTicker ? generateSimulatedAddress(`${mergedDApp.id}-token`) : null)) : null;
  const dAppContractAddress = !isL1DApp ? (contractData?.contractAddress || resolvedContractAddress || generateSimulatedAddress(mergedDApp.id)) : null;
  
  // Format addresses for display - shortened format
  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 2)}...${address.slice(-4)}`;
  };
  
  // Get explorer URLs
  const dAppExplorerUrl = dAppContractAddress ? getExplorerUrl(dAppContractAddress, chainId) : null;
  const tokenExplorerUrl = tokenAddress ? getExplorerUrl(tokenAddress, chainId) : null;

  // Modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [copiedDAppAddress, setCopiedDAppAddress] = useState(false);
  const [copiedTokenAddress, setCopiedTokenAddress] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const handleCopyAddress = async (address: string | null, type: 'dapp' | 'token') => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      if (type === 'dapp') {
        setCopiedDAppAddress(true);
        setTimeout(() => setCopiedDAppAddress(false), 2000);
      } else {
        setCopiedTokenAddress(true);
        setTimeout(() => setCopiedTokenAddress(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  if (isHeaderCollapsed) {
    return (
      <button
        onClick={() => setIsHeaderCollapsed(false)}
        className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        aria-label="Expand header"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        Show Header
      </button>
    );
  }

  return (
    <>
      {/* Featured Image Banner - Default or Custom */}
      {mergedDApp.featuredImage ? (
        <div className="relative w-full h-32 overflow-hidden border-b border-zinc-200 dark:border-zinc-700">
          <Image
            src={mergedDApp.featuredImage}
            alt={`${mergedDApp.name} - Featured image for ${mergedDApp.name} dApp on Kasparex`}
            fill
            className="object-cover"
            unoptimized
          />
          {/* Network Badge - Top Left */}
          {(() => {
            const networkType = getDAppNetworkType(mergedDApp);
            const networkBadgeColor =
              networkType === 'L1'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
            return (
              <span
                className={`absolute top-2 left-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${networkBadgeColor} z-20`}
                title={`${mergedDApp.name} is deployed on ${networkType === 'L1' ? 'Kaspa Layer 1' : 'Kasplex Layer 2'} network`}
                aria-label={`Network type: ${networkType}`}
              >
                {networkType}
              </span>
            );
          })()}
          {/* Collapse Button - Top Right */}
          <button
            onClick={() => setIsHeaderCollapsed(true)}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white transition-colors z-10"
            aria-label="Collapse header"
            title="Collapse header"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
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
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
            return (
              <span
                className={`absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${networkBadgeColor} z-20`}
                title={`${mergedDApp.name} is deployed on ${networkType === 'L1' ? 'Kaspa Layer 1' : 'Kasplex Layer 2'} network`}
                aria-label={`Network type: ${networkType}`}
              >
                {networkType}
              </span>
            );
          })()}
          {/* Collapse Button - Top Right */}
          <button
            onClick={() => setIsHeaderCollapsed(true)}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white transition-colors z-10"
            aria-label="Collapse header"
            title="Collapse header"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      )}

      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800 dark:border-zinc-700 bg-zinc-900 dark:bg-zinc-950 relative">
        {/* Title Section with Icon and Info */}
        <div className="mb-4 relative">
          {/* Top Row: Logo, Titles */}
          <div className="flex items-start gap-4 mb-3">
            <DAppIcon
              dAppName={mergedDApp.name}
              category={mergedDApp.category}
              size={64}
              className="flex-shrink-0"
            />
            
            {/* Dapp and Token Title Rows - Next to logo, aligned to bottom */}
            <div className="space-y-1.5 flex-1 min-w-0 flex items-end pr-24">
              <div className="space-y-1.5 w-full">
                {/* Dapp Row - Show for all dApps (L1 and L2) */}
                <div className="flex items-center gap-2 text-base">
                  <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-zinc-500 dark:text-zinc-500 font-medium">Dapp:</span>
                  <span className="text-zinc-900 dark:text-zinc-100 font-bold truncate">{mergedDApp.name}</span>
                    {dAppExplorerUrl && dAppContractAddress && (
                      <>
                        <span className="text-zinc-400 dark:text-zinc-600">—</span>
                        <a
                          href={dAppExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono transition-colors"
                          title={dAppContractAddress}
                        >
                          {formatAddress(dAppContractAddress)}
                        </a>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopyAddress(dAppContractAddress, 'dapp');
                          }}
                          className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                          title={`Copy: ${dAppContractAddress}`}
                          aria-label={`Copy dApp contract address: ${dAppContractAddress}`}
                        >
                          {copiedDAppAddress ? (
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                
                {/* Token Row */}
                {tokenTicker && (
                  <div className="flex items-center gap-2 text-base">
                    <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-zinc-500 dark:text-zinc-500 font-medium">Token:</span>
                    <Link
                      href={`/tokens/${tokenTicker.toLowerCase()}`}
                      className="text-zinc-900 dark:text-zinc-100 font-bold truncate hover:text-[#02abb8] dark:hover:text-[#02abb8] transition-colors"
                      title={`View ${tokenTicker} token page - trading, supply, and rewards information`}
                      aria-label={`Navigate to ${tokenTicker} token landing page`}
                    >
                      {tokenTicker}
                    </Link>
                    {tokenAddress && tokenExplorerUrl && (
                      <>
                        <span className="text-zinc-400 dark:text-zinc-600">—</span>
                        <a
                          href={tokenExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono transition-colors"
                          title={tokenAddress}
                        >
                          {formatAddress(tokenAddress)}
                        </a>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopyAddress(tokenAddress, 'token');
                          }}
                          className="ml-1 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                          title={`Copy: ${tokenAddress}`}
                          aria-label={`Copy token contract address: ${tokenAddress}`}
                        >
                          {copiedTokenAddress ? (
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section - Full width below logo and titles */}
          {shortDescription && (
            <div className="mb-3">
              <button
                onClick={() => setShowInfoModal(true)}
                className="text-left w-full"
              >
                <p className="text-base text-zinc-300 dark:text-zinc-300 line-clamp-3 hover:text-white dark:hover:text-zinc-100 transition-colors">
                  {shortDescription}{' '}
                  <span className="text-[#02abb8] font-medium">Read more →</span>
                </p>
              </button>
            </div>
          )}
        </div>
      </div>

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
