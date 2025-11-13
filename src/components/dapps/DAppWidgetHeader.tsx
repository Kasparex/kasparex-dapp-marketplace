'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DAppIcon } from './DAppIcon';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { getCategoryById } from '@/lib/categories';
import { isDeployer, useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import Link from 'next/link';
// Edit functionality removed - dApps are now read-only
import { DAppInfoModal } from './DAppInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { DAppGuideAndInfoModal } from './DAppGuideAndInfoModal';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { isEmbedded } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
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
  hideTheme?: boolean;
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
  hideTheme = false,
  accentColor = '#02abb8',
}: DAppWidgetHeaderProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { openChainModal } = useChainModal();
  const isEmbeddedPage = isEmbedded();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleLike, hasLiked, getLikeCount } = useLikes();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // Get chain info for network button
  const chain = chainId ? getChainById(chainId) : null;
  const isTestnet = chain?.testnet ?? false;
  const isMainnet = !isTestnet;
  
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
  
  // Fetch contract data with periodic polling for version updates
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  // Merge contract data and localStorage metadata with frontend data
  const mergedDApp = mergeDAppData(contractData, dapp);

  const category = getCategoryById(mergedDApp.category);
  const compatibility = useNetworkCompatibility(mergedDApp);

  // Periodic polling for version updates (every 30 seconds)
  const [pollingVersion, setPollingVersion] = useState(mergedDApp.version || 'N/A');
  useEffect(() => {
    if (mergedDApp.version) {
      setPollingVersion(mergedDApp.version);
    }
  }, [mergedDApp.version]);

  // Removed redundant polling - useDAppFromContract already has refetchInterval

  // Get deployer info - use default if none available
  const DEFAULT_DEPLOYER = '0x658420Fd88dbd610249a88384f9B1aD387F797c7';
  const deployerAddress = contractData?.deployerAddress || 
    dapp.deployerAddress || 
    (dapp.developer && dapp.developer.startsWith('0x') ? dapp.developer : '') || 
    DEFAULT_DEPLOYER;
  const { profile: deployerProfile } = useDeployerProfile(
    deployerAddress || undefined
  );
  const deployerName = formatDeployerName(deployerAddress, deployerProfile);
  const deployerUrl = getDeployerProfileUrl(deployerAddress);
  const isDeployerUser = isDeployer(connectedAddress, deployerAddress);
  
  // Format address for display (like EVM wallet: 0x65...97c7)
  const formatAddressForDisplay = (addr: string): string => {
    if (!addr || !addr.startsWith('0x')) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  const displayAddress = formatAddressForDisplay(deployerAddress);
  
  // Developer dropdown state
  const [showDeveloperDropdown, setShowDeveloperDropdown] = useState(false);
  const developerDropdownRef = useRef<HTMLDivElement>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // Copy address handler
  const handleCopyAddress = async () => {
    if (deployerAddress) {
      await navigator.clipboard.writeText(deployerAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      setShowDeveloperDropdown(false);
    }
  };
  
  // Close developer dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (developerDropdownRef.current && !developerDropdownRef.current.contains(event.target as Node)) {
        setShowDeveloperDropdown(false);
      }
    }

    if (showDeveloperDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeveloperDropdown]);

  // Version from merged data
  const version = mergedDApp.version || 'N/A';
  const displayVersion = pollingVersion || mergedDApp.version || 'N/A';

  // Short description - priority: description > utility > process (from merged data)
  const shortDescription = mergedDApp.description || mergedDApp.utility || mergedDApp.process || '';
  const truncatedDescription = shortDescription.length > 150 
    ? `${shortDescription.substring(0, 150)}...` 
    : shortDescription;

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGuideAndInfoModal, setShowGuideAndInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showTokenTooltip, setShowTokenTooltip] = useState(false);

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

  // Category link - open in new tab when embedded
  const categoryLinkProps = isEmbeddedPage
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <>
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative">
        {/* Status Indicator - Top Right */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-10">
          <StatusIndicator dapp={mergedDApp} size="md" />
        </div>

        {/* Title Section with Icon */}
        <div className="flex items-start gap-4 mb-4 relative">
          <DAppIcon
            dAppName={mergedDApp.name}
            category={mergedDApp.category}
            size={64}
            className="flex-shrink-0"
          />

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
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
              {tokenTicker && (
                <div className="relative">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-help"
                    onMouseEnter={() => setShowTokenTooltip(true)}
                    onMouseLeave={() => setShowTokenTooltip(false)}
                  >
                    {tokenTicker}
                  </span>
                  {showTokenTooltip && contractData && (
                    <div className="absolute left-0 bottom-full mb-2 w-64 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[9999] p-3 pointer-events-none">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Token Information</p>
                      <div className="space-y-1.5 text-xs">
                        {contractData.totalSupply && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Total Supply:</span>
                            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                              {(Number(contractData.totalSupply) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })} {tokenTicker}
                            </span>
                          </div>
                        )}
                        {tokenAddress && (
                          <div className="flex justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400">Token Address:</span>
                            <span className="text-zinc-900 dark:text-zinc-100 font-mono">{formatAddress(tokenAddress)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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

        {/* Info Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Category Button */}
          {category && (
            <a
              href={`/?category=${mergedDApp.category}`}
              {...categoryLinkProps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <span>{category.emoji}</span>
              <span>{category.name}</span>
              {isEmbeddedPage && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </a>
          )}

          {/* Version */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {displayVersion}
            </span>
          </div>

          {/* Developer Button with Dropdown */}
          {deployerAddress && (
            <div className="relative" ref={developerDropdownRef}>
              <button
                onClick={() => setShowDeveloperDropdown(!showDeveloperDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium rounded-lg"
                aria-label="Developer profile"
              >
                <Avatar address={deployerAddress} size={20} />
                <span className="text-zinc-900 dark:text-zinc-100">
                  {deployerName || displayAddress}
                </span>
                <svg
                  className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${showDeveloperDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDeveloperDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-[9999] overflow-hidden">
                  {/* Developer Info Section */}
                  <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar address={deployerAddress} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {deployerName || 'Developer'}
                        </div>
                        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                          {displayAddress}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleCopyAddress}
                      className="w-full px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {copiedAddress ? 'Copied!' : 'Copy Address'}
                    </button>
                  </div>
                  
                  {/* Actions */}
                  <div className="py-1">
                    <Link
                      href={deployerUrl}
                      onClick={() => setShowDeveloperDropdown(false)}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </Link>
                    
                    {/* Social Media Links */}
                    {mergedDApp.developerLinks && mergedDApp.developerLinks.length > 0 && (
                      <>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
                        {mergedDApp.developerLinks.map((link, index) => (
                          <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowDeveloperDropdown(false)}
                            className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
                          >
                            {link.label.toLowerCase().includes('twitter') || link.label.toLowerCase().includes('x') ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            ) : link.label.toLowerCase().includes('telegram') ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                              </svg>
                            ) : link.label.toLowerCase().includes('website') || link.label.toLowerCase().includes('web') ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}
                            <span>{link.label}</span>
                          </a>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Icon Buttons */}
          {!hideIcons && (
            <div className="flex items-center gap-1 flex-1">
              {/* Left-aligned icons */}
              <div className="flex items-center gap-1">
                {/* Info Icon */}
                {!hideInfo && (mergedDApp.description || mergedDApp.utility) && (
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Description"
                    aria-label="View description"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}

                {/* Guide & Info Icon - Merged */}
                <button
                  onClick={() => setShowGuideAndInfoModal(true)}
                  className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="How to Use & Additional Information"
                  aria-label="View guide and additional information"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>

                {/* Embed Icon */}
                {!hideEmbed && (
                  <button
                    onClick={() => setShowEmbedModal(true)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Embed"
                    aria-label="Get embed code"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}

                {/* Theme Switcher Icon */}
                {!hideTheme && (
                  <button
                    onClick={() => setShowEmbedModal(true)}
                    className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Page Theme"
                    aria-label="Change page theme"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Right-aligned icons */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Edit functionality removed - dApps are now read-only */}

                {/* Star Button (Favorites) */}
                {!hideStar && (
                  <button
                    onClick={() => toggleFavorite(mergedDApp.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite(mergedDApp.id)
                        ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title={isFavorite(mergedDApp.id) ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={isFavorite(mergedDApp.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className="w-5 h-5" fill={isFavorite(mergedDApp.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                )}

                {/* Heart Button (Like) */}
                {!hideHeart && (
                  <button
                    onClick={() => toggleLike(mergedDApp.id)}
                    className={`p-2 rounded-lg transition-colors relative ${
                      hasLiked(mergedDApp.id)
                        ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title={hasLiked(mergedDApp.id) ? 'Unlike' : 'Like'}
                    aria-label={hasLiked(mergedDApp.id) ? 'Unlike' : 'Like'}
                  >
                    <svg className="w-5 h-5" fill={hasLiked(mergedDApp.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {getLikeCount(mergedDApp.id) > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {getLikeCount(mergedDApp.id)}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Wallet and Network Section */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {/* Connect EVM Wallet Button */}
          {!isConnected && (
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) => {
                const ready = mounted;
                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    <button
                      onClick={openConnectModal}
                      type="button"
                      style={{ 
                        backgroundColor: accentColor === '#02abb8' ? '#0097b2' : accentColor
                      }}
                      className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2"
                      onMouseEnter={(e) => {
                        const baseColor = accentColor === '#02abb8' ? '#0097b2' : accentColor;
                        const r = parseInt(baseColor.slice(1, 3), 16);
                        const g = parseInt(baseColor.slice(3, 5), 16);
                        const b = parseInt(baseColor.slice(5, 7), 16);
                        const hoverR = Math.max(0, r - 20);
                        const hoverG = Math.max(0, g - 20);
                        const hoverB = Math.max(0, b - 20);
                        e.currentTarget.style.backgroundColor = `rgb(${hoverR}, ${hoverG}, ${hoverB})`;
                      }}
                      onMouseLeave={(e) => {
                        const baseColor = accentColor === '#02abb8' ? '#0097b2' : accentColor;
                        e.currentTarget.style.backgroundColor = baseColor;
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Connect EVM Wallet
                    </button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          )}

          {/* Interactive Network Switcher Button */}
          {isConnected && (
            <button
              onClick={() => openChainModal?.()}
              className={`px-3 py-2 rounded-lg border transition-colors text-sm font-medium flex items-center gap-2 ${
                isMainnet
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/40'
                  : isTestnet
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              aria-label="Switch network"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
              <span>{chain?.name || 'Switch Network'}</span>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {/* Network Compatibility Status */}
          {isConnected && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              compatibility.isCompatible
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            }`}>
              {compatibility.isCompatible ? '✓ Compatible' : '⚠ Not compatible'}
            </div>
          )}

          {/* Debug Info Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <ToggleSwitch
              checked={showDebugInfo}
              onChange={setShowDebugInfo}
              label="Debug Info"
            />
          </div>
        </div>
      </div>

      {/* Debug & Status Info Section */}
      {showDebugInfo && (
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <CollapsibleSection
            title="Debug & Status Info"
            isOpen={true}
            onToggle={() => {}}
            icon={<span className="text-lg">🔍</span>}
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Show technical details and status
            </p>
            <div className="space-y-4">
              {/* Current Status */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  Current Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Wallet Connected:</span>
                    <span className={`text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isConnected ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  {isConnected && connectedAddress && (
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Connected Address:</span>
                      <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                        {connectedAddress}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Network Compatibility:</span>
                    <span className={`text-sm font-medium ${compatibility.isCompatible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {compatibility.isCompatible ? '✓ Compatible' : '✗ Not Compatible'}
                    </span>
                  </div>
                  {chain && (
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Current Network:</span>
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                        {chain.name} {isTestnet ? '(Testnet)' : '(Mainnet)'}
                      </p>
                    </div>
                  )}
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Network Chain ID:</span>
                    <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                      {chainId || 'Not detected'}
                    </p>
                  </div>
                  {compatibility.requiredChainNames.length > 0 && (
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Required Networks:</span>
                      <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                        {compatibility.requiredChainNames.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* dApp Information */}
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                  dApp Information
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">dApp ID:</span>
                    <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                      {mergedDApp.id}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">dApp Slug:</span>
                    <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                      {mergedDApp.slug || 'N/A'}
                    </p>
                  </div>
                  <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Version:</span>
                    <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                      {pollingVersion || 'N/A'}
                    </p>
                  </div>
                  {resolvedContractAddress && (
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Contract Address:</span>
                      <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                        {resolvedContractAddress}
                      </p>
                    </div>
                  )}
                  {deployerAddress && (
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Deployer Address:</span>
                      <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                        {deployerAddress}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Is Deployer:</span>
                    <span className={`text-sm font-medium ${isDeployerUser ? 'text-green-600 dark:text-green-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {isDeployerUser ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  {mergedDApp.widgetUrl && (
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">Widget URL:</span>
                      <p className="text-xs text-zinc-900 dark:text-zinc-100 break-all mt-1">
                        {mergedDApp.widgetUrl}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Is Embedded:</span>
                    <span className={`text-sm font-medium ${isEmbeddedPage ? 'text-[#0097b2] dark:text-[#0097b2]' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      {isEmbeddedPage ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Modals */}
      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={resolvedContractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      {showEmbedModal && (
        <DAppEmbed
          dapp={mergedDApp}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
      {showGuideAndInfoModal && (
        <DAppGuideAndInfoModal
          dapp={mergedDApp}
          isOpen={showGuideAndInfoModal}
          onClose={() => setShowGuideAndInfoModal(false)}
        />
      )}
      {/* Edit functionality removed - dApps are now read-only */}
    </>
  );
}
