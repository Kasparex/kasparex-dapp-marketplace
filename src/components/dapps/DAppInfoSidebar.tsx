'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { getCategoryById } from '@/lib/categories';
import { isDeployer, useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import Link from 'next/link';
import Image from 'next/image';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { SocialIcons } from './SocialIcons';
import { AffiliateWidget } from './AffiliateWidget';
import { isEmbedded } from '@/lib/utils';
import { getExplorerUrl } from '@/lib/dapps/deployer';

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

  // Category link props
  const categoryLinkProps = isEmbeddedPage
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  // Featured image
  const featuredImage = mergedDApp.featuredImage;

  // Get token and contract addresses for display
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
      <aside className="hidden lg:block w-full lg:w-64 flex-shrink-0">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
          <div className="p-4 lg:p-6 space-y-6">
            {/* Box 1: Action Icons (Centered) */}
            {!hideIcons && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-center gap-2">
                  {/* Info Icon */}
                  {!hideInfo && (mergedDApp.description || mergedDApp.utility) && (
                    <button
                      onClick={() => setShowInfoModal(true)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Description"
                      aria-label="View description"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}

                  {/* Embed Icon */}
                  {!hideEmbed && (
                    <button
                      onClick={() => setShowEmbedModal(true)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Embed"
                      aria-label="Get embed code"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}

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

            {/* Developer & Info (No Box) */}
            <div className="space-y-3">
              {/* Featured Image (Above Developer Button) */}
              {featuredImage && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <Image
                    src={featuredImage}
                    alt={mergedDApp.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              {!featuredImage && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                  <svg className="w-12 h-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {deployerAddress && (
                <>
                  <Link
                    href={deployerUrl}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium rounded-lg"
                    aria-label="Developer profile"
                  >
                    <Avatar address={deployerAddress} size={24} />
                    <span className="text-zinc-900 dark:text-zinc-100 flex-1 text-left truncate">
                      {deployerName || displayAddress}
                    </span>
                    <svg
                      className="w-4 h-4 text-zinc-600 dark:text-zinc-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  {/* Social Icons (from Info modal) */}
                  <div className="flex items-center justify-center">
                    <SocialIcons iconSize="w-4 h-4" />
                  </div>
                </>
              )}

              {/* Network & Compatibility (Moved below Developer) */}
              <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
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

            {/* Box 4: Referral Link */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
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
