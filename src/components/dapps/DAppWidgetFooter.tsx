'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { getCategoryById } from '@/lib/categories';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppEmbed } from './DAppEmbed';
import { DAppReferralModal } from './DAppReferralModal';
import { getDAppNetworkType } from '@/lib/dapps';
import { generateSimulatedTicker, generateSimulatedAddress } from '@/lib/dapps';

interface DAppWidgetFooterProps {
  dapp: DApp;
  contractAddress?: string;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideEmbed?: boolean;
  /** When true, do not render the category/version/ID/modal/star/heart row (used on dApp page where that row lives in the right column). */
  hideMetaRow?: boolean;
}

export function DAppWidgetFooter({ 
  dapp, 
  contractAddress,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideEmbed = false,
  hideMetaRow = false,
}: DAppWidgetFooterProps) {
  const chainId = useChainId();
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

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

  // Check if this is an L1 dApp
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';

  // Get token information
  let rawTicker: string | null = null;
  if (isL1DApp) {
    if (mergedDApp.slug === 'send-kas' || mergedDApp.name.toLowerCase().includes('send kas')) {
      rawTicker = 'KAS';
    } else if (mergedDApp.slug === 'send-krex' || mergedDApp.name.toLowerCase().includes('send krex')) {
      rawTicker = 'KREX';
    }
  } else {
    rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
  }
  const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;

  // Likes and favorites
  const { toggleLike, getLikeCount, hasLiked, isWalletConnected: isWalletConnectedForLikes } = useLikes();
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const likeCount = getLikeCount(mergedDApp.id);
  const isLiked = hasLiked(mergedDApp.id);
  const isFavoriteDapp = isFavorite(mergedDApp.id);

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  if (isFooterCollapsed) {
    return (
      <button
        onClick={() => setIsFooterCollapsed(false)}
        className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        aria-label="Expand footer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        Show footer
      </button>
    );
  }

  return (
    <>
      <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex flex-col gap-4">
          {/* Category/Version/ID and Icons Row (hidden on dApp page; shown in right column) */}
          {!hideMetaRow && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Left: Category/Version/ID */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Button (clickable on dApp page) */}
              {category && (
                <Link
                  href={`/?category=${mergedDApp.category}`}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <span className="mr-1.5">{category.emoji}</span>
                  <span>{category.name}</span>
                </Link>
              )}
              
              {/* Version Box */}
              {mergedDApp.version && mergedDApp.version !== 'N/A' && (
                <div className="px-3 py-1.5 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-center">
                  {mergedDApp.version.replace(/^v\s*/i, '')}
                </div>
              )}

              {/* Embed Icon (only on dApp pages, not cards) */}
              {!hideEmbed && (
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
              )}

              {/* Referral Icon (only on dApp pages, not cards) */}
              <DAppReferralModal dapp={mergedDApp} contractAddress={resolvedContractAddress} />
              
              {/* dApp ID */}
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {mergedDApp.id}
              </span>
            </div>

            {/* Right: Star/Heart Icons */}
            {!hideIcons && (
              <div className="flex items-center gap-1">
                {/* Star Button (Favorites) */}
                {!hideStar && (
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
                )}

                {/* Heart Button (Like) */}
                {!hideHeart && (
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
                )}
              </div>
            )}
          </div>
          )}

          {/* Footer Text and Collapse Button Row */}
          <div className="flex items-center justify-between">
            {/* Footer Text - Aligned Left */}
            <div className="text-xs text-zinc-500 dark:text-zinc-500 text-left">
              <Link
                href="/"
                className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                title="The Largest dApp Marketplace on Kaspa. Explore, Build, and Earn Today."
              >
                Kasparex Hub
              </Link>
              {' '}| Built with love by{' '}
              <Link
                href="https://bio.kasparex.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
                title="Symbol of intelligence, resilience, and purpose. Fair-launched, community-owned KRC-20 and L2 token on the Kaspa network.

Est. 2024 🔥"
              >
                Krex
              </Link>
            </div>
            
            {/* Collapse Button - Right (under star/heart icons) */}
            <button
              onClick={() => setIsFooterCollapsed(true)}
              className="p-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded text-white transition-colors"
              aria-label="Collapse footer"
              title="Collapse footer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Embed Modal */}
      {showEmbedModal && (
        <DAppEmbed
          dapp={mergedDApp}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </>
  );
}
