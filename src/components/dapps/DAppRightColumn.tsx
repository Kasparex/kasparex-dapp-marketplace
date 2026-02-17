'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, getDAppNetworkType } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { DAppIcon } from './DAppIcon';
import { DAppActionsColumn } from './DAppActionsColumn';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { getContractAddress } from '@/lib/contracts/addresses';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { CategoryIcon } from './CategoryIcon';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppEmbed } from './DAppEmbed';

interface DAppRightColumnProps {
  dapp: DApp;
  contractAddress?: string;
}

/**
 * Premium right column: Meta row (category, version, ID, modals, star/heart) → Title → Reward tokens → Description (clickable → info modal) → Actions/Purchase box.
 */
export function DAppRightColumn({ dapp, contractAddress: propContractAddress }: DAppRightColumnProps) {
  const chainId = useChainId();
  const mergedDApp = mergeDAppData(null, dapp);

  let resolvedContractAddress = propContractAddress || mergedDApp.contractAddress || '';
  if (!resolvedContractAddress) {
    resolvedContractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
  }
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress?.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  const category = getCategoryById(mergedDApp.category);
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';
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

  const { toggleLike, getLikeCount, hasLiked, isWalletConnected: isWalletConnectedForLikes } = useLikes();
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const likeCount = getLikeCount(mergedDApp.id);
  const isLiked = hasLiked(mergedDApp.id);
  const isFavoriteDapp = isFavorite(mergedDApp.id);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const description = mergedDApp.utility || mergedDApp.description || mergedDApp.process || '';

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Meta row: Icon + Category, Version, ID, modal icons, Star, Heart (same styling as dApp cards) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {category && (
            <Link
              href={`/?category=${mergedDApp.category}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <CategoryIcon id={category.id} />
              <span>{category.name}</span>
            </Link>
          )}
          {mergedDApp.version && mergedDApp.version !== 'N/A' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
              v{mergedDApp.version.replace(/^v\s*/i, '')}
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
            {mergedDApp.id}
          </div>
          <button
            onClick={(e) => handleIconClick(e, () => setShowInfoModal(true))}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Info"
            aria-label="View dApp info"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
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
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => handleIconClick(e, () => {
              if (isWalletConnectedForFavorites) toggleFavorite(mergedDApp.id);
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
          <button
            onClick={(e) => handleIconClick(e, () => {
              if (isWalletConnectedForLikes) toggleLike(mergedDApp.id);
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
              <span className="absolute -top-1 -right-1 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 rounded-full px-1">
                {likeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Logo + Title */}
      <div className="flex items-start gap-4">
        <DAppIcon
          dAppName={mergedDApp.name}
          category={mergedDApp.category}
          size={64}
          className="flex-shrink-0 rounded-xl"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">
            {mergedDApp.name}
          </h1>
          {/* Reward tokens (same as dApp cards) */}
          {tokenTicker && (
            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 mt-2">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">100 {tokenTicker}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">10 XP</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description - slightly longer, no underline, Read more link */}
      <div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm lg:text-base leading-relaxed line-clamp-5">
          {description || 'No description available.'}
        </p>
        <button
          type="button"
          onClick={() => setShowInfoModal(true)}
          className="mt-2 text-sm font-medium text-[#02abb8] hover:text-[#0299a6] dark:hover:text-[#02abb8] transition-colors inline-flex items-center gap-1"
        >
          Read more
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Actions, Costs & Fees */}
      <DAppActionsColumn dapp={dapp} contractAddress={propContractAddress} />

      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={resolvedContractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      {showEmbedModal && (
        <DAppEmbed dapp={mergedDApp} onClose={() => setShowEmbedModal(false)} />
      )}
    </div>
  );
}
