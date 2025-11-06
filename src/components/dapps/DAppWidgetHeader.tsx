'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAccount, useChainId } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { isDeployer, useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import { EditDAppModal } from './EditDAppModal';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { DAppGuideAndInfoModal } from './DAppGuideAndInfoModal';
import { DAppThemeSwitcherModal } from './DAppThemeSwitcherModal';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { isEmbedded } from '@/lib/utils';

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
  
  // Get contract address if not provided
  let resolvedContractAddress = contractAddress || dapp.contractAddress || '';
  if (!resolvedContractAddress && dapp.slug === 'simple-payment') {
    try {
      resolvedContractAddress = getContractAddress(chainId, 'SimplePayment') || '';
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
        <div className="flex items-start gap-4 mb-4">
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
              {contractData?.name || dapp.name}
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
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Version:</span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              v{displayVersion}
            </span>
          </div>

          {/* Deployer Info */}
          {deployerAddress && (
            <a
              href={deployerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <Avatar address={deployerAddress} size={20} />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                {deployerName}
              </span>
            </a>
          )}

          {/* Icon Buttons */}
          <div className="flex items-center gap-1 ml-auto">
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

            {/* Edit Button (Deployers only) */}
            {isDeployerUser && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                Edit
              </button>
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
                      className="px-4 py-2 rounded-lg bg-[#0097b2] text-white hover:bg-[#007a91] transition-colors text-sm font-medium"
                    >
                      Connect EVM Wallet
                    </button>
                  </div>
                );
              }}
            </ConnectButton.Custom>
          )}

          {/* Network Info */}
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Network:</span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {compatibility.currentChainName || 'Unknown'}
              </span>
              {!compatibility.isCompatible && (
                <>
                  <span className="text-zinc-400 dark:text-zinc-600">•</span>
                  <button
                    onClick={() => openChainModal?.()}
                    className="text-sm text-[#02abb8] hover:text-[#0299a3] transition-colors font-medium"
                  >
                    Switch Network
                  </button>
                </>
              )}
            </div>
          )}

          {/* Network Status Badge */}
          {isConnected && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              compatibility.isCompatible
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
            }`}>
              {compatibility.isCompatible ? '✓ Compatible' : '⚠ Mismatch'}
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
