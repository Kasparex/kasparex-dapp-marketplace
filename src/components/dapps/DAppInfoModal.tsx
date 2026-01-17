'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useDeployerProfile, formatDeployerName, getDeployerProfileUrl } from '@/lib/dapps/deployer';
import { Avatar } from '@/components/Avatar';
import { useDAppFromContract } from '@/lib/dapps/contractData';
import { useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { SocialIcons } from './SocialIcons';

interface DAppInfoModalProps {
  dapp: DApp;
  contractAddress?: string;
  onClose: () => void;
}

export function DAppInfoModal({ dapp, contractAddress, onClose }: DAppInfoModalProps) {
  const chainId = useChainId();
  const [showDeveloperDropdown, setShowDeveloperDropdown] = useState(false);
  const isL1DApp = getDAppNetworkType(dapp) === 'L1';
  
  // Get contract data for deployer info (only for L2 dApps)
  const { data: contractData } = useDAppFromContract(
    !isL1DApp && contractAddress && contractAddress.startsWith('0x') ? contractAddress : undefined,
    chainId
  );

  // Get deployer info
  const DEFAULT_DEPLOYER = '0x658420Fd88dbd610249a88384f9B1aD387F797c7';
  const deployerAddress = contractData?.deployerAddress || 
    dapp.deployerAddress || 
    (dapp.developer && dapp.developer.startsWith('0x') ? dapp.developer : '') || 
    DEFAULT_DEPLOYER;
  const { profile: deployerProfile } = useDeployerProfile(deployerAddress || undefined);
  const deployerName = formatDeployerName(deployerAddress, deployerProfile);
  const deployerUrl = getDeployerProfileUrl(deployerAddress);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close developer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDeveloperDropdown) {
        const target = e.target as HTMLElement;
        if (!target.closest('.developer-dropdown-container')) {
          setShowDeveloperDropdown(false);
        }
      }
    };
    if (showDeveloperDropdown) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [showDeveloperDropdown]);

  // Get contract addresses for ecosystem components (only for L2 dApps)
  const gridTokenAddress = !isL1DApp ? (getContractAddress(chainId, 'GRIDToken') || undefined) : undefined;
  const proofOfUtilityAddress = !isL1DApp ? (getContractAddress(chainId, 'ProofOfUtility') || undefined) : undefined;
  const feeHandlerAddress = !isL1DApp ? (getContractAddress(chainId, 'FeeHandler') || undefined) : undefined;
  const rewardManagerAddress = !isL1DApp ? (getContractAddress(chainId, 'RewardManager') || undefined) : undefined;
  
  // Get resolved contract address (only for L2 dApps)
  const resolvedContractAddress = !isL1DApp ? (contractAddress || dapp.contractAddress || '') : '';
  
  // Use contract data as-is
  const mergedContractData = contractData;
  
  // Format addresses for display
  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get explorer URLs
  const getExplorerLink = (address: string | undefined) => {
    if (!address || !address.startsWith('0x')) return null;
    return getExplorerUrl(address, chainId);
  };
  
  // Format token supply
  const formatTokenSupply = (supply: bigint | null | undefined) => {
    if (!supply) return 'N/A';
    return (Number(supply) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-8 py-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-[90vw] w-full max-h-[95vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {dapp.name}
            </h2>
            {dapp.version && (
              <span className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                {dapp.version?.replace(/^v\s*/i, '') || dapp.version}
              </span>
            )}
            <div className="flex-1"></div>
            {/* Developer Dropdown */}
            <div className="relative developer-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeveloperDropdown(!showDeveloperDropdown);
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <Avatar address={deployerAddress} size={24} />
                <span>{deployerName}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDeveloperDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-2 z-10">
                  <a
                    href={deployerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    View Profile
                  </a>
                  <div className="px-4 py-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 mt-2 pt-2">
                    {deployerAddress.slice(0, 6)}...{deployerAddress.slice(-4)}
                  </div>
                </div>
              )}
            </div>
            {/* Social Icons */}
            <SocialIcons className="ml-4" iconSize="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-4"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - 2 Column Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left Column - Main Content (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {dapp.description && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Description
                  </h3>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {dapp.description}
                  </p>
                </div>
              )}

              {/* Utility */}
              {dapp.utility && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Utility
                  </h3>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {dapp.utility}
                  </p>
                </div>
              )}

              {/* How to Use */}
              {dapp.process && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    How to Use
                  </h3>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {dapp.process}
                  </p>
                </div>
              )}

              {/* Benefits */}
              {dapp.benefits && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Benefits
                  </h3>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {dapp.benefits}
                  </p>
                </div>
              )}

              {/* Security */}
              {dapp.security && (
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </h3>
                  <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                    {dapp.security}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column - Info Timeline (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Timeline Container */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700"></div>
                  
                  <div className="space-y-6">
                    {/* Fees */}
                    <div className="relative pl-12">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-[#02abb8] flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Fees</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                        Small fee supports the Kasparex ecosystem infrastructure and development.
                      </p>
                      {feeHandlerAddress && (
                        <a
                          href={getExplorerLink(feeHandlerAddress)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#02abb8] hover:underline"
                        >
                          {formatAddress(feeHandlerAddress)}
                        </a>
                      )}
                    </div>

                    {/* Rewards */}
                    {(mergedContractData?.tokenAddress || gridTokenAddress) && (
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Rewards</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                          Earn tokens through Proof-of-Utility interactions:
                        </p>
                        <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 mb-2">
                          {mergedContractData?.tokenAddress && mergedContractData.ticker && (
                            <li>• {mergedContractData.ticker} tokens</li>
                          )}
                          {gridTokenAddress && <li>• GRID tokens</li>}
                        </ul>
                        {rewardManagerAddress && (
                          <a
                            href={getExplorerLink(rewardManagerAddress)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-[#02abb8] hover:underline"
                          >
                            {formatAddress(rewardManagerAddress)}
                          </a>
                        )}
                      </div>
                    )}

                    {/* dApp Token */}
                    {mergedContractData?.tokenAddress && mergedContractData.ticker && (
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                          {mergedContractData.ticker} Token
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                          Total Supply: {formatTokenSupply(mergedContractData.totalSupply)} {mergedContractData.ticker}
                        </p>
                        <a
                          href={getExplorerLink(mergedContractData.tokenAddress)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#02abb8] hover:underline"
                        >
                          {formatAddress(mergedContractData.tokenAddress)}
                        </a>
                      </div>
                    )}

                    {/* GRID Token */}
                    {gridTokenAddress && (
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">GRID Token</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                          Ecosystem reward token earned across all dApps.
                        </p>
                        <a
                          href={getExplorerLink(gridTokenAddress)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#02abb8] hover:underline"
                        >
                          {formatAddress(gridTokenAddress)}
                        </a>
                      </div>
                    )}

                    {/* Proof of Utility */}
                    {proofOfUtilityAddress && (
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Proof of Utility</h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                          Tracks on-chain usage and enables automatic rewards.
                        </p>
                        <a
                          href={getExplorerLink(proofOfUtilityAddress)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#02abb8] hover:underline"
                        >
                          {formatAddress(proofOfUtilityAddress)}
                        </a>
                      </div>
                    )}

                    {/* Contract Addresses */}
                    {resolvedContractAddress && resolvedContractAddress.startsWith('0x') && (
                      <div className="relative pl-12">
                        <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-zinc-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">dApp Contract</h4>
                        <a
                          href={getExplorerLink(resolvedContractAddress)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-[#02abb8] hover:underline break-all"
                        >
                          {resolvedContractAddress}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}
