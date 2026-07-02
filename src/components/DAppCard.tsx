'use client';

import { DApp, isDirectoryListingDApp, type DAppNetworkFilter } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { useDAppXpReward } from '@/hooks/useDAppXpReward';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { CategoryIcon } from './dapps/CategoryIcon';
import { mergeDAppData } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { useDAppAccess } from '@/hooks/useDAppAccess';
import { useDAppWalletGate } from '@/hooks/useDAppWalletGate';
import { DAppWalletGateModal } from './dapps/DAppWalletGateModal';
import { useRouter } from 'next/navigation';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';
import { AuthorInline } from '@/components/ui/AuthorInline';
import { resolveDAppAuthor } from '@/lib/dapps/deployer';

interface DAppCardProps {
  dapp: DApp;
  selectedNetwork?: DAppNetworkFilter;
}

export function DAppCard({ dapp, selectedNetwork = 'all' }: DAppCardProps) {
  const router = useRouter();
  const mergedDApp = mergeDAppData(null, dapp);
  const access = useDAppAccess({ dapp: mergedDApp, selectedNetwork });
  const { isOpenable } = access;
  const { l1Modal, closeL1Modal, promptGate } = useDAppWalletGate();

  const category = getCategoryById(mergedDApp.category);
  const slug = mergedDApp.slug || generateDAppSlug(mergedDApp.name);
  const xpReward = useDAppXpReward(mergedDApp);
  const isDirectoryListing = isDirectoryListingDApp(mergedDApp);
  const { wallet: authorWallet, name: authorCustomName } = resolveDAppAuthor(mergedDApp);
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

  const handleCardClick = () => {
    if (!isOpenable) {
      promptGate(mergedDApp, access, { selectedNetwork });
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
              dapp={mergedDApp}
              size={56}
              className="flex-shrink-0 rounded-xl"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3
                  className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100"
                  title={mergedDApp.name}
                >
                  {mergedDApp.name}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isDirectoryListing ? (
                    <HubPointsEarnBadge points={xpReward} size="sm" />
                  ) : null}
                </div>
              </div>

              {authorWallet ? (
                <AuthorInline
                  address={authorWallet}
                  displayName={authorCustomName}
                  href={`/u/${encodeURIComponent(authorWallet)}`}
                  className="mt-1.5"
                />
              ) : (
                <AuthorInline
                  address={authorCustomName || mergedDApp.name}
                  displayName={authorCustomName || 'Unknown'}
                  href={null}
                  className="mt-1.5"
                />
              )}
            </div>
          </div>

          <div className="mb-4 flex-grow min-h-0">
            <p className="kx-body-sm line-clamp-3">
              {mergedDApp.utility || mergedDApp.description || mergedDApp.process || ''}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {category && (
                  <KxListingCategoryChip
                    icon={<CategoryIcon id={category.id} />}
                    title={`Filter by ${category.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/dapps?category=${encodeURIComponent(category.id)}`);
                    }}
                  >
                    {category.name}
                  </KxListingCategoryChip>
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

      {l1Modal ? (
        <DAppWalletGateModal
          dapp={l1Modal.dapp}
          isOpen
          onClose={closeL1Modal}
          selectedNetwork={l1Modal.selectedNetwork}
        />
      ) : null}
    </>
  );
}
