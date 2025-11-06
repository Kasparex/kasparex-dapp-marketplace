'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAccount, useChainId } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { getCategoryById } from '@/lib/categories';
import { isDeployer, useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import Link from 'next/link';
import { EditDAppModal } from './EditDAppModal';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { DAppGuideAndInfoModal } from './DAppGuideAndInfoModal';
import { DAppThemeSwitcherModal } from './DAppThemeSwitcherModal';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { isEmbedded } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';

interface DAppWidgetHeaderProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppWidgetHeader({ dapp, contractAddress }: DAppWidgetHeaderProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { openChainModal } = useChainModal();
  const category = getCategoryById(dapp.category);
  const compatibility = useNetworkCompatibility(dapp);
  const isEmbeddedPage = isEmbedded();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleLike, hasLiked, getLikeCount } = useLikes();
  
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

  // Periodic polling for version updates (every 30 seconds)
  const [pollingVersion, setPollingVersion] = useState(contractData?.version || dapp.version || 'N/A');
  useEffect(() => {
    if (contractData?.version) {
      setPollingVersion(contractData.version);
    }
  }, [contractData?.version]);

  useEffect(() => {
    if (!resolvedContractAddress || !resolvedContractAddress.startsWith('0x')) {
      return;
    }

    const interval = setInterval(() => {
      // Trigger a refetch by updating a dependency
      // The useDAppFromContract hook will handle the actual refetch
      setPollingVersion((prev) => {
        // This will cause a re-render and potentially trigger refetch
        return prev;
      });
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [resolvedContractAddress, chainId]);

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

  // Version from contract or frontend
  const version = contractData?.version || dapp.version || 'N/A';
  const displayVersion = contractData?.version || pollingVersion || dapp.version || 'N/A';

  // Short description - priority: description > utility > process
  const shortDescription = dapp.description || dapp.utility || dapp.process || '';
  const truncatedDescription = shortDescription.length > 150 
    ? `${shortDescription.substring(0, 150)}...` 
    : shortDescription;

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGuideAndInfoModal, setShowGuideAndInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Category link - open in new tab when embedded
  const categoryLinkProps = isEmbeddedPage
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <>
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {/* Title Section with Emoji Box */}
        <div className="flex items-start gap-4 mb-4 relative">
          {/* Emoji Box - same as DAppCard */}
          {dapp.image ? (
            <div className="flex-shrink-0 relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <Image
                src={dapp.image}
                alt={dapp.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl">{category?.emoji || '⚡'}</span>
            </div>
          )}

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
                  {contractData?.name || dapp.name}
                </a>
              ) : (
                contractData?.name || dapp.name
              )}
            </h1>
            {truncatedDescription && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {truncatedDescription}
              </p>
            )}
          </div>

        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Category Button */}
          {category && (
            <a
              href={`/?category=${dapp.category}`}
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
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                aria-label="Developer profile"
              >
                <Avatar address={deployerAddress} size={20} />
                <span className="text-zinc-900 dark:text-zinc-100">
                  {displayAddress}
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
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden">
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
                    {dapp.developerLinks && dapp.developerLinks.length > 0 && (
                      <>
                        <div className="border-t border-zinc-200 dark:border-zinc-800 my-1" />
                        {dapp.developerLinks.map((link, index) => (
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
          <div className="flex items-center gap-1 flex-1">
            {/* Left-aligned icons */}
            <div className="flex items-center gap-1">
              {/* Star Button (Favorites) */}
              <button
                onClick={() => toggleFavorite(dapp.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite(dapp.id)
                    ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title={isFavorite(dapp.id) ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isFavorite(dapp.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg className="w-5 h-5" fill={isFavorite(dapp.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>

              {/* Heart Button (Like) */}
              <button
                onClick={() => toggleLike(dapp.id)}
                className={`p-2 rounded-lg transition-colors relative ${
                  hasLiked(dapp.id)
                    ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title={hasLiked(dapp.id) ? 'Unlike' : 'Like'}
                aria-label={hasLiked(dapp.id) ? 'Unlike' : 'Like'}
              >
                <svg className="w-5 h-5" fill={hasLiked(dapp.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {getLikeCount(dapp.id) > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {getLikeCount(dapp.id)}
                  </span>
                )}
              </button>

              {/* Info Icon */}
              {(dapp.description || dapp.utility) && (
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

              {/* Theme Switcher Icon */}
              <button
                onClick={() => setShowThemeModal(true)}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Page Theme"
                aria-label="Change page theme"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </button>
            </div>

            {/* Right-aligned Edit Button (Deployers only) */}
            {isDeployerUser && (
              <div className="ml-auto">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
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
                      className="px-4 py-2 rounded-lg bg-[#0097b2] text-white hover:bg-[#007a91] transition-colors text-sm font-medium flex items-center gap-2"
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
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <EditDAppModal
          dapp={dapp}
          contractAddress={resolvedContractAddress}
          contractData={contractData}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showInfoModal && (
        <DAppInfoModal
          dapp={dapp}
          contractAddress={resolvedContractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      {showEmbedModal && (
        <DAppEmbed
          dapp={dapp}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
      {showGuideAndInfoModal && (
        <DAppGuideAndInfoModal
          dapp={dapp}
          isOpen={showGuideAndInfoModal}
          onClose={() => setShowGuideAndInfoModal(false)}
        />
      )}
      {showThemeModal && (
        <DAppThemeSwitcherModal
          dapp={dapp}
          isOpen={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />
      )}
    </>
  );
}
