'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { getCategoryById } from '@/lib/categories';
import { isDeployer, useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import Link from 'next/link';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { SocialIcons } from './SocialIcons';
import { AffiliateWidget } from './AffiliateWidget';
import { isEmbedded } from '@/lib/utils';

interface DAppInfoSidebarProps {
  dapp: DApp;
  contractAddress?: string;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideInfo?: boolean;
  hideEmbed?: boolean;
  accentColor?: string;
}

export function DAppInfoSidebar({
  dapp,
  contractAddress,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideInfo = false,
  hideEmbed = false,
  accentColor = '#02abb8',
}: DAppInfoSidebarProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { openChainModal } = useChainModal();
  const isEmbeddedPage = isEmbedded();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleLike, hasLiked, getLikeCount } = useLikes();
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  
  // Get chain info
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
  
  // Fetch contract data
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  // Merge contract data
  const mergedDApp = mergeDAppData(contractData, dapp);
  const category = getCategoryById(mergedDApp.category);
  const compatibility = useNetworkCompatibility(mergedDApp);

  // Version
  const [pollingVersion, setPollingVersion] = useState(mergedDApp.version || 'N/A');
  useEffect(() => {
    if (mergedDApp.version) {
      setPollingVersion(mergedDApp.version);
    }
  }, [mergedDApp.version]);

  // Get deployer info
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
  
  // Format address for display
  const formatAddressForDisplay = (addr: string): string => {
    if (!addr || !addr.startsWith('0x')) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  const displayAddress = formatAddressForDisplay(deployerAddress);
  const displayVersion = pollingVersion || mergedDApp.version || 'N/A';

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

  // Category link props
  const categoryLinkProps = isEmbeddedPage
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <>
      <aside className="hidden lg:block w-full lg:w-64 flex-shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Developer */}
            {deployerAddress && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Developer
                </h3>
                <div className="relative" ref={developerDropdownRef}>
                  <button
                    onClick={() => setShowDeveloperDropdown(!showDeveloperDropdown)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium rounded-lg"
                    aria-label="Developer profile"
                  >
                    <Avatar address={deployerAddress} size={24} />
                    <span className="text-zinc-900 dark:text-zinc-100 flex-1 text-left truncate">
                      {deployerName || displayAddress}
                    </span>
                    <svg
                      className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform flex-shrink-0 ${showDeveloperDropdown ? 'rotate-180' : ''}`}
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
              </div>
            )}

            {/* Category & Version */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Info
              </h3>
              <div className="space-y-2">
                {category && (
                  <a
                    href={`/?category=${mergedDApp.category}`}
                    {...categoryLinkProps}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors w-full justify-center"
                  >
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </a>
                )}
                {displayVersion && displayVersion !== 'N/A' && (
                  <div className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-center">
                    v{displayVersion}
                  </div>
                )}
              </div>
            </div>

            {/* Network & Compatibility */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Network
              </h3>
              <div className="space-y-2">
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
                            className="w-full px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Connect Wallet
                          </button>
                        </div>
                      );
                    }}
                  </ConnectButton.Custom>
                )}

                {isConnected && (
                  <>
                    <button
                      onClick={() => openChainModal?.()}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm font-medium flex items-center justify-between ${
                        isMainnet
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/40'
                          : isTestnet
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      aria-label="Switch network"
                    >
                      <div className="flex items-center gap-2">
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
                        <span className="text-xs">{chain?.name || 'Switch Network'}</span>
                      </div>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isConnected && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium text-center ${
                        compatibility.isCompatible
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {compatibility.isCompatible ? '✓ Compatible' : '⚠ Not compatible'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Debug Toggle */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Debug
              </h3>
              <ToggleSwitch
                checked={showDebugInfo}
                onChange={setShowDebugInfo}
                label="Debug Info"
              />
            </div>

            {/* Action Icons */}
            {!hideIcons && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Actions
                </h3>
                <div className="flex items-center gap-2">
                  {/* Info Icon */}
                  {!hideInfo && (mergedDApp.description || mergedDApp.utility) && (
                    <button
                      onClick={() => setShowInfoModal(true)}
                      className="flex-1 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Description"
                      aria-label="View description"
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}

                  {/* Embed Icon */}
                  {!hideEmbed && (
                    <button
                      onClick={() => setShowEmbedModal(true)}
                      className="flex-1 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Embed"
                      aria-label="Get embed code"
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}

                  {/* Star Button (Favorites) */}
                  {!hideStar && (
                    <button
                      onClick={() => toggleFavorite(mergedDApp.id)}
                      className={`flex-1 p-2 rounded-lg transition-colors ${
                        isFavorite(mergedDApp.id)
                          ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title={isFavorite(mergedDApp.id) ? 'Remove from favorites' : 'Add to favorites'}
                      aria-label={isFavorite(mergedDApp.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg className="w-5 h-5 mx-auto" fill={isFavorite(mergedDApp.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  )}

                  {/* Heart Button (Like) */}
                  {!hideHeart && (
                    <button
                      onClick={() => toggleLike(mergedDApp.id)}
                      className={`flex-1 p-2 rounded-lg transition-colors relative ${
                        hasLiked(mergedDApp.id)
                          ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                      title={hasLiked(mergedDApp.id) ? 'Unlike' : 'Like'}
                      aria-label={hasLiked(mergedDApp.id) ? 'Unlike' : 'Like'}
                    >
                      <svg className="w-5 h-5 mx-auto" fill={hasLiked(mergedDApp.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

            {/* Social Icons */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Social
              </h3>
              <SocialIcons className="justify-center" iconSize="w-5 h-5" />
            </div>

            {/* Referral Link */}
            <div>
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                Referral
              </h3>
              <AffiliateWidget
                dAppId={dapp.id}
                dAppName={dapp.name}
                dAppContractAddress={resolvedContractAddress}
              />
            </div>
          </div>
        </div>
      </aside>

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
    </>
  );
}

