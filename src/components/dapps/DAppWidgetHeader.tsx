'use client';

import { useState } from 'react';
import { useChainId } from 'wagmi';
import { DApp, getDAppNetworkType } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { DAppInfoModal } from './DAppInfoModal';
import { StatusIndicatorDot } from './StatusIndicatorDot';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppEmbed } from './DAppEmbed';

interface DAppWidgetHeaderProps {
  dapp: DApp;
  contractAddress?: string;
  hideIcons?: boolean;
  hideStar?: boolean;
  hideHeart?: boolean;
  hideInfo?: boolean;
  hideEmbed?: boolean;
  accentColor?: string;
}

export function DAppWidgetHeader({ 
  dapp, 
  contractAddress,
  hideIcons = false,
  hideStar = false,
  hideHeart = false,
  hideInfo = false,
  hideEmbed = false,
  accentColor = '#02abb8',
}: DAppWidgetHeaderProps) {
  const chainId = useChainId();

  let resolvedContractAddress = contractAddress || dapp.contractAddress || '';
  if (!resolvedContractAddress) {
    resolvedContractAddress = getDAppContractAddress(dapp, chainId) || '';
  }
  
  // Fetch contract data
  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress && resolvedContractAddress.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId
  );

  // Merge contract data
  const mergedDApp = mergeDAppData(contractData, dapp);

  // Modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

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

  const networkType = getDAppNetworkType(mergedDApp);
  const statusLower = (mergedDApp.status || '').toLowerCase();
  const isTestnet =
    statusLower === 'testnet' ||
    (mergedDApp.network || '').toLowerCase().includes('testnet') ||
    (mergedDApp.network || '').toLowerCase().includes('galleon') ||
    (mergedDApp.name || '').toLowerCase().includes('testnet');

  const statusType: 'mainnet' | 'testnet' | 'suspended' | 'none' =
    statusLower === 'suspended' ? 'suspended' : statusLower === 'mainnet' ? 'mainnet' : isTestnet ? 'testnet' : 'none';

  const statusLabel = (() => {
    const env = statusType === 'testnet' ? 'Testnet' : statusType === 'mainnet' ? 'Mainnet' : mergedDApp.status;
    if (!env) return '';
    if (env === 'Suspended') return 'Suspended';

    const lower = (mergedDApp.network || '').toLowerCase();
    if (networkType === 'L2') {
      const family = lower.includes('igra') ? 'Igra' : lower.includes('kasplex') ? 'Kasplex' : 'L2';
      return `${family} ${env}`;
    }
    const family = lower.includes('kaspa') ? 'Kaspa' : 'L1';
    return `${family} ${env}`;
  })();

  const badgeColor =
    statusType === 'testnet'
      ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/25'
      : statusType === 'mainnet'
        ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-500/25'
        : statusType === 'suspended'
          ? 'bg-red-500/15 text-red-900 dark:text-red-200 border-red-500/25'
          : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20';

  return (
    <>
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeColor} shadow-sm`}>
              {networkType === 'L1' ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              )}
              {networkType}
            </span>

            {statusLabel ? (
              <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeColor} shadow-sm`}>
                {statusType === 'mainnet' || statusType === 'testnet' || statusType === 'suspended' ? (
                  <StatusIndicatorDot
                    statusType={statusType === 'mainnet' ? 'mainnet' : statusType === 'testnet' ? 'testnet' : 'suspended'}
                    size="sm"
                    className="!animate-pulse"
                  />
                ) : null}
                {statusLabel}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!hideInfo ? (
              <button
                type="button"
                onClick={(e) => handleIconClick(e, () => setShowInfoModal(true))}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Info"
                aria-label="View dApp info"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            ) : null}

            {!hideEmbed ? (
              <button
                type="button"
                onClick={(e) => handleIconClick(e, () => setShowEmbedModal(true))}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Embed"
                aria-label="Get embed code"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            ) : null}

            {!hideStar ? (
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
            ) : null}

            {!hideHeart ? (
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
            ) : null}
          </div>
        </div>
      </div>

      {/* Info Modal */}
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

    </>
  );
}
