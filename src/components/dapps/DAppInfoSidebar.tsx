'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
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
import { SocialIcons } from './SocialIcons';
import { isEmbedded } from '@/lib/utils';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { KREXStatusBox } from '../rewards/KREXStatusBox';
import { NFTStatusBox } from '../rewards/NFTStatusBox';
import { NODEStatusBox } from '../rewards/NODEStatusBox';
import { KREXNFTMultipliersBox } from './KREXNFTMultipliersBox';

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
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Sidebar hide/show and resize state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('dapp-info-sidebar-hidden');
    const savedWidth = localStorage.getItem('dapp-info-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('dapp-info-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('dapp-info-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      // For right sidebar, calculate width from right edge
      const newWidth = sidebarRect.right - e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);
  
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
      {/* Show Sidebar Button - Fixed when hidden */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(false)}
          className="hidden lg:block fixed right-0 top-20 z-[60] p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Show sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <aside 
        ref={sidebarRef}
        className={`
          hidden lg:block flex-shrink-0
          fixed lg:sticky top-16 lg:top-0 right-0 z-40
          h-[calc(100vh-4rem)] lg:h-screen
          overflow-y-auto
          bg-white dark:bg-zinc-950
          border-l border-zinc-200 dark:border-zinc-800
          transition-all duration-300 ease-in-out
          ${isHidden ? 'translate-x-[100%]' : ''}
        `}
        style={{ 
          width: isHidden ? 0 : `${sidebarWidth}px`,
          minWidth: isHidden ? 0 : `${sidebarWidth}px`,
          maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
          cursor: isResizing ? 'col-resize' : ''
        }}
        onMouseMove={(e) => {
          if (!isHidden && !isResizing && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            // Full height border detection (left side for right sidebar)
            const isOnBorder = e.clientX >= rect.left && e.clientX <= rect.left + 4;
            sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
            if (isOnBorder) {
              sidebarRef.current.style.borderLeft = '2px solid #06b6d4';
            } else {
              sidebarRef.current.style.borderLeft = '';
            }
          }
        }}
        onMouseLeave={() => {
          if (sidebarRef.current && !isResizing) {
            sidebarRef.current.style.borderLeft = '';
          }
        }}
        onMouseDown={(e) => {
          // Make the left border draggable (for right sidebar, full height)
          if (!isHidden && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.left + 4) {
              e.preventDefault();
              setIsResizing(true);
            }
          }
        }}
      >
        {/* Header with Hide Button */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsHidden(true)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="Hide sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="flex items-center justify-center">
              <SocialIcons iconSize="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className={`p-4 lg:p-6 ${isHidden ? 'hidden' : ''}`}>
            {/* Developer & Info (No Box) */}
            <div className="space-y-6">
              {deployerAddress && (
                <Link
                  href={deployerUrl}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium rounded-lg"
                  aria-label="View developer profile"
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
              )}

              {/* KREX/NFT Multipliers */}
              <KREXNFTMultipliersBox />

              {/* KREX Status */}
              <KREXStatusBox />

              {/* NFT Status */}
              <NFTStatusBox />

              {/* NODE Status */}
              <NODEStatusBox />
            </div>
        </div>
      </aside>

      {/* Modals */}
      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={isL1DApp ? undefined : resolvedContractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </>
  );
}
