'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppInfoModal } from './dapps/DAppInfoModal';
import { DAppEmbed } from './dapps/DAppEmbed';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { StatusIndicator } from './dapps/StatusIndicator';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { getContractAddress } from '@/lib/contracts/addresses';
import { createPortal } from 'react-dom';

interface DAppCardProps {
  dapp: DApp;
}

export function DAppCard({ dapp }: DAppCardProps) {
  const chainId = useChainId();
  
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
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showDAppTooltip, setShowDAppTooltip] = useState(false);
  const [showTokenTooltip, setShowTokenTooltip] = useState(false);
  const [showInfoIconTooltip, setShowInfoIconTooltip] = useState(false);
  const [showEmbedIconTooltip, setShowEmbedIconTooltip] = useState(false);
  
  // Refs for tooltip positioning
  const dAppTooltipRef = useRef<HTMLDivElement>(null);
  const tokenTooltipRef = useRef<HTMLDivElement>(null);
  const infoIconTooltipRef = useRef<HTMLButtonElement>(null);
  const embedIconTooltipRef = useRef<HTMLButtonElement>(null);
  
  const [tooltipPositions, setTooltipPositions] = useState<{
    dApp?: { top: number; left: number };
    token?: { top: number; left: number };
    infoIcon?: { top: number; left: number };
    embedIcon?: { top: number; left: number };
  }>({});
  
  // Calculate tooltip positions with boundary checking
  const calculateTooltipPosition = (rect: DOMRect, tooltipWidth: number = 288) => {
    const padding = 8;
    let left = rect.left;
    let top = rect.top;
    
    // Check right boundary
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }
    
    // Check left boundary
    if (left < padding) {
      left = padding;
    }
    
    // Check bottom boundary (tooltip appears above, so we check if there's enough space above)
    const tooltipHeight = 200; // Approximate tooltip height
    if (top - tooltipHeight - padding < 0) {
      // Not enough space above, show below instead
      top = rect.bottom + padding;
    } else {
      // Show above
      top = rect.top;
    }
    
    return { top, left };
  };
  
  useEffect(() => {
    if (showDAppTooltip && dAppTooltipRef.current) {
      const rect = dAppTooltipRef.current.getBoundingClientRect();
      const pos = calculateTooltipPosition(rect, 288);
      setTooltipPositions(prev => ({
        ...prev,
        dApp: pos
      }));
    }
  }, [showDAppTooltip]);
  
  useEffect(() => {
    if (showTokenTooltip && tokenTooltipRef.current) {
      const rect = tokenTooltipRef.current.getBoundingClientRect();
      const pos = calculateTooltipPosition(rect, 288);
      setTooltipPositions(prev => ({
        ...prev,
        token: pos
      }));
    }
  }, [showTokenTooltip]);
  
  useEffect(() => {
    if (showInfoIconTooltip && infoIconTooltipRef.current) {
      const rect = infoIconTooltipRef.current.getBoundingClientRect();
      const pos = calculateTooltipPosition(rect, 256);
      setTooltipPositions(prev => ({
        ...prev,
        infoIcon: pos
      }));
    }
  }, [showInfoIconTooltip]);
  
  useEffect(() => {
    if (showEmbedIconTooltip && embedIconTooltipRef.current) {
      const rect = embedIconTooltipRef.current.getBoundingClientRect();
      const pos = calculateTooltipPosition(rect, 256);
      setTooltipPositions(prev => ({
        ...prev,
        embedIcon: pos
      }));
    }
  }, [showEmbedIconTooltip]);

  // Get token information
  // For Quiz-to-Earn, ensure contract address is shown
  const quizToEarnContractAddress = mergedDApp.slug === 'quiz-to-earn' 
    ? getContractAddress(chainId, 'QuizToEarn') 
    : null;
  
  const tokenTicker = contractData?.ticker || null;
  const tokenAddress = contractData?.tokenAddress || null;
  const dAppContractAddress = contractData?.contractAddress || mergedDApp.contractAddress || quizToEarnContractAddress || null;
  
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
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all relative"
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
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
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

          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {mergedDApp.utility || mergedDApp.description || mergedDApp.process || ''}
          </p>
        </div>
      </div>

      {/* Bottom Section: dApp/Token Info (left) and Star/Heart (right) */}
      <div className="mt-4 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between gap-2 relative z-10">
        {/* Left: dApp and Token Information */}
        <div className="flex flex-col gap-1.5 text-xs min-w-0 flex-1">
          {/* dApp Row */}
          <div className="relative">
            <div
              ref={dAppTooltipRef}
              className="flex items-center gap-1.5 cursor-help"
              onMouseEnter={() => setShowDAppTooltip(true)}
              onMouseLeave={() => setShowDAppTooltip(false)}
            >
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Dapp contract:</span>
              {dAppContractAddress && dAppExplorerUrl ? (
                <a
                  href={dAppExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono transition-colors"
                  title={dAppContractAddress}
                >
                  {formatAddress(dAppContractAddress)}
                </a>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">contract not available</span>
              )}
            </div>
            {showDAppTooltip && tooltipPositions.dApp && typeof window !== 'undefined' && createPortal(
              <div 
                className="fixed w-72 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none"
                style={{ 
                  top: tooltipPositions.dApp.top < 200 ? `${tooltipPositions.dApp.top + 24}px` : `${tooltipPositions.dApp.top}px`,
                  left: `${tooltipPositions.dApp.left}px`,
                  transform: tooltipPositions.dApp.top < 200 ? 'none' : 'translateY(calc(-100% - 8px))',
                  maxWidth: 'calc(100vw - 16px)',
                }}
              >
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">dApp Information</p>
                <div className="space-y-2 text-xs">
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Each dApp is associated with a token that serves as both a reward mechanism and a tradeable asset. 
                    Users earn tokens through Proof-of-Utility rewards when they interact with the dApp.
                  </p>
                  {mergedDApp.description && (
                    <div>
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">Description: </span>
                      <span className="text-zinc-600 dark:text-zinc-400">{mergedDApp.description}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-300 dark:border-zinc-600">
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium mb-1">Rewards System:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
                      <li>Proof-of-Utility tracking for on-chain usage</li>
                      <li>Automatic token rewards for interactions</li>
                      {tokenTicker && <li>Earn {tokenTicker} tokens through usage</li>}
                    </ul>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
          
          {/* Token Row */}
          <div className="relative">
            <div
              ref={tokenTooltipRef}
              className="flex items-center gap-1.5 cursor-help"
              onMouseEnter={() => setShowTokenTooltip(true)}
              onMouseLeave={() => setShowTokenTooltip(false)}
            >
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {tokenTicker ? `(${tokenTicker}) Token contract:` : 'Token contract:'}
              </span>
              {tokenAddress && tokenExplorerUrl ? (
                <a
                  href={tokenExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] font-mono transition-colors"
                  title={tokenAddress}
                >
                  {formatAddress(tokenAddress)}
                </a>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400">not linked yet..</span>
              )}
            </div>
            {showTokenTooltip && contractData && tooltipPositions.token && typeof window !== 'undefined' && createPortal(
              <div 
                className="fixed w-72 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none"
                style={{ 
                  top: tooltipPositions.token.top < 200 ? `${tooltipPositions.token.top + 24}px` : `${tooltipPositions.token.top}px`,
                  left: `${tooltipPositions.token.left}px`,
                  transform: tooltipPositions.token.top < 200 ? 'none' : 'translateY(calc(-100% - 8px))',
                  maxWidth: 'calc(100vw - 16px)',
                }}
              >
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Token Information</p>
                <div className="space-y-2 text-xs">
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    This token is not only a reward token for dApp usage but also available for trading, buying, and selling. 
                    Future listings and marketplaces will enable full token trading functionality.
                  </p>
                  {contractData.totalSupply && (
                    <div className="flex justify-between pt-2 border-t border-zinc-300 dark:border-zinc-600">
                      <span className="text-zinc-600 dark:text-zinc-400">Max Supply:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                        {(Number(contractData.totalSupply) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 0 })} {tokenTicker}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-300 dark:border-zinc-600">
                    <p className="text-zinc-700 dark:text-zinc-300 font-medium mb-1">Token Features:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-600 dark:text-zinc-400">
                      <li>Reward mechanism for dApp usage</li>
                      <li>Tradeable asset (marketplace coming soon)</li>
                      <li>Buy and sell functionality (future)</li>
                    </ul>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        {/* Right: Action Icons (Info, Guide, Embed, Star, Heart) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Info Icon */}
          {(mergedDApp.description || mergedDApp.utility) && (
            <div className="relative">
              <button
                ref={infoIconTooltipRef}
                onClick={(e) => handleIconClick(e, () => setShowInfoModal(true))}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                onMouseEnter={() => setShowInfoIconTooltip(true)}
                onMouseLeave={() => setShowInfoIconTooltip(false)}
                aria-label="View description"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showInfoIconTooltip && tooltipPositions.infoIcon && typeof window !== 'undefined' && createPortal(
                <div 
                  className="fixed w-64 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none"
                  style={{ 
                    top: tooltipPositions.infoIcon.top < 200 ? `${tooltipPositions.infoIcon.top + 24}px` : `${tooltipPositions.infoIcon.top}px`,
                    left: `${tooltipPositions.infoIcon.left}px`,
                    transform: tooltipPositions.infoIcon.top < 200 ? 'none' : 'translateY(calc(-100% - 8px))',
                    maxWidth: 'calc(100vw - 16px)',
                  }}
                >
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Fees Information</p>
                  <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <p>Each dApp transaction includes a small fee that supports the Kasparex ecosystem. Fees are automatically collected and distributed to support infrastructure, rewards, and development.</p>
                    <p className="pt-2 border-t border-zinc-300 dark:border-zinc-600">Fee rates vary by dApp and are displayed before transaction confirmation.</p>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}

          {/* Embed Icon */}
          <div className="relative">
            <button
              ref={embedIconTooltipRef}
              onClick={(e) => handleIconClick(e, () => setShowEmbedModal(true))}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              onMouseEnter={() => setShowEmbedIconTooltip(true)}
              onMouseLeave={() => setShowEmbedIconTooltip(false)}
              aria-label="Get embed code"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {showEmbedIconTooltip && tooltipPositions.embedIcon && typeof window !== 'undefined' && createPortal(
              <div 
                className="fixed w-64 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-xl z-[99999] p-3 pointer-events-none"
                style={{ 
                  top: tooltipPositions.embedIcon.top < 200 ? `${tooltipPositions.embedIcon.top + 24}px` : `${tooltipPositions.embedIcon.top}px`,
                  left: `${tooltipPositions.embedIcon.left}px`,
                  transform: tooltipPositions.embedIcon.top < 200 ? 'none' : 'translateY(calc(-100% - 8px))',
                  maxWidth: 'calc(100vw - 16px)',
                }}
              >
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">How to Embed</p>
                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <p>Click this icon to get the embed code for this dApp widget. Copy the provided iframe code and paste it into your website&apos;s HTML.</p>
                  <p className="pt-2 border-t border-zinc-300 dark:border-zinc-600">The widget will be fully functional and responsive on your site.</p>
                </div>
              </div>,
              document.body
            )}
          </div>

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

      {/* Modals */}
      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={mergedDApp.contractAddress}
          onClose={() => setShowInfoModal(false)}
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

