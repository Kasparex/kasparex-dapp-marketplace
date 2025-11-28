'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, generateSimulatedAddress } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppInfoModal } from './dapps/DAppInfoModal';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { StatusIndicator } from './dapps/StatusIndicator';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DAppCardRewards } from './rewards/DAppCardRewards';
import { DAppFeesModal } from './dapps/DAppFeesModal';
import { useMouseGradient } from '@/hooks/useMouseGradient';

interface DemoCardProps {
  dapp: DApp;
  gradientColors: [string, string];
  index: number;
}

export function DemoCard({ dapp, gradientColors }: DemoCardProps) {
  const chainId = useChainId();
  const { cardRef, mousePosition, isHovering } = useMouseGradient<HTMLAnchorElement>();
  
  // Merge localStorage metadata with frontend data
  const mergedDApp = mergeDAppData(null, dapp);
  
  // Get contract data for token information
  let contractAddress = mergedDApp.contractAddress || '';
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

  // Get token information
  // For Quiz-to-Earn, ensure contract address is shown
  const quizToEarnContractAddress = mergedDApp.slug === 'quiz-to-earn' 
    ? getContractAddress(chainId, 'QuizToEarn') 
    : null;
  
  const rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
  const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;
  const tokenAddress = contractData?.tokenAddress || (tokenTicker ? generateSimulatedAddress(`${mergedDApp.id}-token`) : null);
  const dAppContractAddress = contractData?.contractAddress || mergedDApp.contractAddress || quizToEarnContractAddress || generateSimulatedAddress(mergedDApp.id);
  
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

  // Calculate gradient position based on mouse position
  const [color1, color2] = gradientColors;
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const gradientStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '0.5rem',
    background: isHovering
      ? `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(${rgb1}, 0.08), rgba(${rgb2}, 0.03), transparent 60%)`
      : 'transparent',
    pointerEvents: 'none',
    transition: isHovering ? 'none' : 'opacity 0.3s ease',
    zIndex: 1,
    opacity: isHovering ? 1 : 0,
  };

  return (
    <Link
      ref={cardRef}
      href={`/dapps/${slug}`}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative flex flex-col min-h-[280px]"
    >
      {/* Gradient overlay that follows mouse */}
      <div style={gradientStyle} />

      {/* Status Indicator and Fees Icon - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <StatusIndicator dapp={mergedDApp} size="md" />
        <DAppFeesModal dapp={mergedDApp} tokenTicker={tokenTicker} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Top Row: Logo, Titles, and Status Indicator */}
        <div className="flex items-start gap-4 mb-3">
        <DAppIcon
          dAppName={mergedDApp.name}
          category={mergedDApp.category}
          size={48}
          className="flex-shrink-0"
        />

          {/* Dapp and Token Title Rows - Next to logo */}
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Dapp Row */}
            {dAppContractAddress && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-zinc-500 dark:text-zinc-500 font-medium">Dapp:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold truncate">{mergedDApp.name}</span>
            </div>
            )}
            
            {/* Token Row */}
            {tokenTicker && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-zinc-500 dark:text-zinc-500 font-medium">Token:</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold truncate">
                  {tokenTicker}
              </span>
            </div>
          )}
          </div>
        </div>

        {/* Description Section - Full width below logo and titles, flex-grow to push content down */}
        <div className="mb-3 flex-grow min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
            {mergedDApp.utility || mergedDApp.description || mergedDApp.process || ''}
          </p>
      </div>

        {/* Bottom Section: Token Supply, Category/Version/ID and Icons Row - Aligned to bottom */}
        <div className="mt-auto">
          {/* Token Supply Section */}
          <DAppCardRewards 
            tokenTicker={tokenTicker}
          />

          {/* Category/Version/ID and Icons Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap mt-2">
            {/* Left: Category/Version/ID */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Button (NOT clickable on cards) */}
              {category && (
                <div className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                  <span className="mr-1.5">{category.emoji}</span>
                  <span>{category.name}</span>
                  </div>
              )}
              
              {/* Version Box */}
              {mergedDApp.version && mergedDApp.version !== 'N/A' && (
                <div className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-center">
                  {mergedDApp.version.replace(/^v\s*/i, '')}
                  </div>
              )}
              
              {/* dApp ID */}
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {mergedDApp.id}
              </span>
            </div>

            {/* Right: Star/Heart Icons */}
            <div className="flex items-center gap-1">
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
    </Link>
  );
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}
