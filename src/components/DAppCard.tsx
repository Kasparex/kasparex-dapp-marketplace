'use client';

import { useMemo, useState } from 'react';
import { useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { CategoryIcon } from './dapps/CategoryIcon';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { getChainById } from '@/lib/wagmi';
import { getDAppNetworkType } from '@/lib/dapps';
import { useDAppAccess } from '@/hooks/useDAppAccess';
import { DAppWalletGateModal } from './dapps/DAppWalletGateModal';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

interface DAppCardProps {
  dapp: DApp;
  selectedNetwork?: 'all' | 'L1' | 'L2';
}

export function DAppCard({ dapp, selectedNetwork = 'all' }: DAppCardProps) {
  const chainId = useChainId();
  const mergedDApp = mergeDAppData(null, dapp);
  const { isOpenable } = useDAppAccess({ dapp: mergedDApp, selectedNetwork });

  const category = getCategoryById(mergedDApp.category);
  const slug = mergedDApp.slug || generateDAppSlug(mergedDApp.name);
  const networkType = getDAppNetworkType(mergedDApp);
  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = Boolean(chain?.testnet);
  const dAppRewards = useMemo(() => {
    const config = getDAppPaymentConfig(mergedDApp, networkType);
    const rewards = getDefaultRewardsBreakdown(chainId);
    const firstAction = config?.actions?.[0];
    const baseCost = firstAction?.baseCost ?? 1;
    const gridReward = Math.round(rewards.gridPerKas * baseCost);
    const xpReward = Math.round(rewards.xpPerKas * baseCost);
    const gridLabel = isTestnet ? 'tGRID' : 'GRID';
    return { gridReward, xpReward, gridLabel };
  }, [mergedDApp, networkType, chainId, isTestnet]);
  const { toggleLike, getLikeCount, hasLiked, isWalletConnected: isWalletConnectedForLikes } = useLikes();
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const likeCount = getLikeCount(mergedDApp.id);
  const isLiked = hasLiked(mergedDApp.id);
  const isFavoriteDapp = isFavorite(mergedDApp.id);

  const [showGateModal, setShowGateModal] = useState(false);

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleCardClick = () => {
    if (!isOpenable) {
      setShowGateModal(true);
    }
  };

  return (
    <>
      <KxListingCard
        href={isOpenable ? `/dapps/${slug}` : undefined}
        disabled={!isOpenable}
        onClick={!isOpenable ? handleCardClick : undefined}
        accent="dapps"
        className="relative flex flex-col min-h-0"
      >
        <KxListingCardMedia>
          {(mergedDApp.featuredImage || mergedDApp.image) ? (
            <img
              src={mergedDApp.featuredImage || mergedDApp.image}
              alt={mergedDApp.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg className="h-12 w-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </KxListingCardMedia>

        <KxListingCardBody className="relative z-10 flex flex-1 min-h-0 flex-col">
          <div className="flex items-start gap-4 mb-4">
            <DAppIcon
              dAppName={mergedDApp.name}
              category={mergedDApp.category}
              size={56}
              className="flex-shrink-0 rounded-xl"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3
                  className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100"
                  title={mergedDApp.name}
                >
                  {mergedDApp.name}
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 mt-2">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{formatLargeNumber(dAppRewards.gridReward)} {dAppRewards.gridLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">{formatLargeNumber(dAppRewards.xpReward)} pts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex-grow min-h-0">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
              {mergedDApp.utility || mergedDApp.description || mergedDApp.process || ''}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {category && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                    <CategoryIcon id={category.id} />
                    <span>{category.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={(e) => handleIconClick(e, () => {
                    if (isWalletConnectedForFavorites) {
                      toggleFavorite(mergedDApp.id);
                    }
                  })}
                  className={`p-1.5 rounded-lg transition-colors ${isFavoriteDapp
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
                    if (isWalletConnectedForLikes) {
                      toggleLike(mergedDApp.id);
                    }
                  })}
                  className={`p-1.5 rounded-lg transition-colors relative ${isLiked
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
          </div>
        </KxListingCardBody>
      </KxListingCard>

      {showGateModal ? (
        <DAppWalletGateModal
          dapp={mergedDApp}
          isOpen={showGateModal}
          onClose={() => setShowGateModal(false)}
          selectedNetwork={selectedNetwork}
        />
      ) : null}
    </>
  );
}
