'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppInfoModal } from './dapps/DAppInfoModal';
import { DAppGuideAndInfoModal } from './dapps/DAppGuideAndInfoModal';
import { DAppEmbed } from './dapps/DAppEmbed';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { StatusIndicator } from './dapps/StatusIndicator';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppCardProps {
  dapp: DApp;
}

export function DAppCard({ dapp }: DAppCardProps) {
  const chainId = useChainId();
  
  // Merge localStorage metadata with frontend data
  const mergedDApp = mergeDAppData(null, dapp);
  
  // Get contract data for token information
  let contractAddress = mergedDApp.contractAddress || '';
  if (!contractAddress && mergedDApp.slug === 'kas-tipping-system') {
    contractAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3';
  }
  if (!contractAddress) {
    contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
  }
  const { data: contractData } = useDAppFromContract(
    contractAddress?.startsWith('0x') ? contractAddress : undefined,
    chainId
  );
  
  const category = getCategoryById(mergedDApp.category);
  const slug = mergedDApp.slug || generateDAppSlug(mergedDApp.name);
  const { toggleLike, getLikeCount, hasLiked, isWalletConnected: isWalletConnectedForLikes } = useLikes();
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const likeCount = getLikeCount(mergedDApp.id);
  const isLiked = hasLiked(mergedDApp.id);
  const isFavoriteDapp = isFavorite(mergedDApp.id);

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGuideAndInfoModal, setShowGuideAndInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showTokenTooltip, setShowTokenTooltip] = useState(false);

  // Get token information
  const tokenTicker = contractData?.ticker || null;
  const tokenAddress = contractData?.tokenAddress || null;
  const dAppContractAddress = contractData?.contractAddress || mergedDApp.contractAddress || null;
  
  // Format addresses for display
  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Get explorer URLs
  const dAppExplorerUrl = dAppContractAddress ? getExplorerUrl(dAppContractAddress, chainId) : null;
  const tokenExplorerUrl = tokenAddress ? getExplorerUrl(tokenAddress, chainId) : null;

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <Link
      href={`/dapps/${slug}`}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative overflow-hidden"
    >
      <div className="flex items-start gap-4 relative z-10">
        <DAppIcon
          dAppName={mergedDApp.name}
          category={mergedDApp.category}
          size={48}
          className="flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {mergedDApp.name}
              </h3>
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
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Action Icons - Moved here from bottom */}
              <div className="flex items-center gap-1">
                {/* Info Icon */}
                {(mergedDApp.description || mergedDApp.utility) && (
                  <button
                    onClick={(e) => handleIconClick(e, () => setShowInfoModal(true))}
                    className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Description"
                    aria-label="View description"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}

                {/* Guide & Info Icon */}
                <button
                  onClick={(e) => handleIconClick(e, () => setShowGuideAndInfoModal(true))}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="How to Use & Additional Information"
                  aria-label="View guide and additional information"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>

                {/* Embed Icon */}
                <button
                  onClick={(e) => handleIconClick(e, () => setShowEmbedModal(true))}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Embed"
                  aria-label="Get embed code"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Star Button (Favorites) */}
                <button
                  onClick={(e) => handleIconClick(e, () => {
                    if (isWalletConnectedForFavorites) {
                      toggleFavorite(mergedDApp.id);
                    }
                  })}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isFavoriteDapp
                      ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                      : isWalletConnectedForFavorites
                      ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                  title={isWalletConnectedForFavorites ? (isFavoriteDapp ? 'Remove from favorites' : 'Add to favorites') : 'Connect wallet to favorite'}
                  aria-label={isWalletConnectedForFavorites ? (isFavoriteDapp ? 'Remove from favorites' : 'Add to favorites') : 'Connect wallet to favorite'}
                  disabled={!isWalletConnectedForFavorites}
                >
                  <svg className="w-4 h-4" fill={isFavoriteDapp ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>

                {/* Heart Button (Like) */}
                <button
                  onClick={(e) => handleIconClick(e, () => {
                    if (isWalletConnectedForLikes) {
                      toggleLike(mergedDApp.id);
                    }
                  })}
                  className={`p-1.5 rounded-lg transition-colors relative ${
                    isLiked
                      ? 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/20'
                      : isWalletConnectedForLikes
                      ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                  title={isWalletConnectedForLikes ? (isLiked ? 'Unlike' : 'Like') : 'Connect wallet to like'}
                  aria-label={isWalletConnectedForLikes ? (isLiked ? 'Unlike' : 'Like') : 'Connect wallet to like'}
                  disabled={!isWalletConnectedForLikes}
                >
                  <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {likeCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {likeCount}
                    </span>
                  )}
                </button>
              </div>
              <StatusIndicator dapp={mergedDApp} size="md" />
            </div>
          </div>

          {category && (
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              <span>{category.emoji}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {category.name}
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">•</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {mergedDApp.id}
              </span>
            </div>
          )}

          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
            {mergedDApp.utility || mergedDApp.description || mergedDApp.process || ''}
          </p>

          {/* dApp and Token Information Rows */}
          <div className="space-y-1.5 mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/50">
            {/* dApp Row */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500 dark:text-zinc-500 font-medium min-w-[60px]">dApp:</span>
              <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">{mergedDApp.name}</span>
              {dAppContractAddress && dAppExplorerUrl && (
                <a
                  href={dAppExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono ml-auto transition-colors"
                  title={dAppContractAddress}
                >
                  {formatAddress(dAppContractAddress)}
                </a>
              )}
            </div>
            
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
                    onClick={(e) => e.stopPropagation()}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono ml-auto transition-colors"
                    title={tokenAddress}
                  >
                    {formatAddress(tokenAddress)}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={mergedDApp.contractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      {showGuideAndInfoModal && (
        <DAppGuideAndInfoModal
          dapp={mergedDApp}
          isOpen={showGuideAndInfoModal}
          onClose={() => setShowGuideAndInfoModal(false)}
        />
      )}
      {showEmbedModal && (
        <DAppEmbed
          dapp={mergedDApp}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </Link>
  );
}

