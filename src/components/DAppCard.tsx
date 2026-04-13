'use client';

import { useMemo, useState } from 'react';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, generateSimulatedAddress, getDAppNetworkType } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { getDAppPaymentConfig } from '@/lib/payments/config';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppInfoModal } from './dapps/DAppInfoModal';
import { CategoryIcon } from './dapps/CategoryIcon';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getChainById } from '@/lib/wagmi';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCardPlaceholder } from '@/components/kx/KxListingCardPlaceholder';

interface DAppCardProps {
  dapp: DApp;
  /** When true, card is visible but indicates that interaction needs a wallet. */
  isLocked?: boolean;
}

export function DAppCard({ dapp, isLocked = false }: DAppCardProps) {
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
  const networkType = getDAppNetworkType(mergedDApp);
  const chain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);
  const isTestnet = Boolean(chain?.testnet);
  const dAppRewards = useMemo(() => {
    const config = getDAppPaymentConfig(mergedDApp, networkType);
    const rewards = getDefaultRewardsBreakdown(chainId);
    const firstAction = config?.actions?.[0];
    const baseCost = firstAction?.baseCost ?? 1;
    const gridReward = Math.round(rewards.grtPerKas * baseCost);
    const xpReward = Math.round(rewards.xpPerKas * baseCost);
    const gridLabel = isTestnet ? 'tGRID' : 'GRID';
    return { gridReward, xpReward, gridLabel };
  }, [mergedDApp, networkType, chainId, isTestnet]);
  const { toggleLike, getLikeCount, hasLiked, isWalletConnected: isWalletConnectedForLikes } = useLikes();
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const likeCount = getLikeCount(mergedDApp.id);
  const isLiked = hasLiked(mergedDApp.id);
  const isFavoriteDapp = isFavorite(mergedDApp.id);

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Get token information
  // For L1 dApps, use special token mappings (Send KAS -> KAS, Send KREX -> KREX)
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';
  let rawTicker: string | null = null;
  if (isL1DApp) {
    // L1 dApps: map to actual tokens
    if (mergedDApp.slug === 'send-kas' || mergedDApp.name.toLowerCase().includes('send kas')) {
      rawTicker = 'KAS';
    } else if (mergedDApp.slug === 'send-krex' || mergedDApp.name.toLowerCase().includes('send krex')) {
      rawTicker = 'KREX';
    }
  } else {
    // L2 dApps: use contract data or generate
    rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
  }
  const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;
  const tokenAddress = contractData?.tokenAddress || (tokenTicker ? generateSimulatedAddress(`${mergedDApp.id}-token`) : null);
  const dAppContractAddress = contractData?.contractAddress || mergedDApp.contractAddress || generateSimulatedAddress(mergedDApp.id);

  // Format addresses for display - shortened format
  const formatAddress = (address: string | null) => {
    if (!address || !address.startsWith('0x')) return null;
    return `${address.slice(0, 2)}...${address.slice(-4)}`;
  };

  // Get explorer URLs
  const dAppExplorerUrl = dAppContractAddress ? getExplorerUrl(dAppContractAddress, chainId) : null;
  const tokenExplorerUrl = tokenAddress ? getExplorerUrl(tokenAddress, chainId) : null;

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  // Get network name for display
  const networkName = mergedDApp.network || (networkType === 'L1' ? 'L1 Kaspa' : 'L2 Igra');
  
  // Get status type for non-pulsating dot indicator
  const getStatusDotColor = () => {
    const statusType = mergedDApp.status?.toLowerCase();
    if (statusType === 'suspended') return 'bg-red-500';
    if (networkType === 'L1') return 'bg-green-500';
    if (networkType === 'L2') {
      if (mergedDApp.network?.toLowerCase().includes('testnet')) return 'bg-yellow-500';
      return 'bg-green-500';
    }
    return 'bg-zinc-500';
  };

  return (
    <>
    <KxListingCard
      href={`/dapps/${slug}`}
      accent="hub"
      className="w-full text-left relative flex flex-col min-h-[360px]"
    >
      <div
        className={isLocked ? 'transition-all group-hover:opacity-70 group-hover:blur-[0.5px]' : ''}
        aria-hidden={isLocked ? true : undefined}
      >
        <KxListingCardMedia aspectClass="h-40 aspect-auto">
          {(mergedDApp.featuredImage || mergedDApp.image) ? (
            <>
              <img
                src={mergedDApp.featuredImage || mergedDApp.image}
                alt={mergedDApp.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            </>
          ) : (
            <KxListingCardPlaceholder />
          )}
        </KxListingCardMedia>

        <KxListingCardBody comfortable className="relative z-10 flex-1 min-h-0">
          {/* Top Section: Profile Picture on Left, Title and Network on Right */}
          <div className="flex items-start gap-4 mb-4">
            {/* Profile Picture - Left Side */}
            <DAppIcon
              dAppName={mergedDApp.name}
              category={mergedDApp.category}
              size={56}
              className="flex-shrink-0 rounded-xl"
            />

            {/* Title and Network - Right Side */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3
                  className="text-lg font-black text-zinc-900 dark:text-zinc-100 transition-colors duration-300 flex-1 truncate"
                  title={mergedDApp.name}
                >
                  {mergedDApp.name}
                </h3>

                {/* Network Indicator with Dot - Right Side */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {networkType === 'L1' ? (
                    <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  )}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {networkName}
                  </span>
                  {/* Dot Indicator - Next to Network Title */}
                  <div className={`w-2 h-2 rounded-full ${getStatusDotColor()}`} />
                </div>
              </div>

              {/* Per-dApp rewards: GRID/tGRID + XP for first action */}
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
                  <span className="font-medium">{formatLargeNumber(dAppRewards.xpReward)} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section - Fixed Spacing */}
          <div className="mb-6 flex-grow min-h-0">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">
              {mergedDApp.utility || mergedDApp.description || mergedDApp.process || ''}
            </p>
          </div>

          {/* Bottom Section: Category, Version, ID, Star/Heart, Open Button */}
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              {/* Left: Category, Version, ID */}
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {/* Category with Icon - Gray Styling */}
                {category && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                    <CategoryIcon id={category.id} />
                    <span>{category.name}</span>
                  </div>
                )}

                {/* Version - Same rounded corners and border as category badges */}
                {mergedDApp.version && mergedDApp.version !== 'N/A' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                    v{mergedDApp.version.replace(/^v\s*/i, '')}
                  </div>
                )}

                {/* dApp ID - Same rounded corners and border as category badges */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300">
                  {mergedDApp.id}
                </div>
              </div>

              {/* Right: Star → Heart */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Star Button (Favorites) */}
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

                {/* Heart Button (Like) */}
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
      </div>

      {isLocked ? (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="mx-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md px-4 py-3 text-center shadow-lg">
            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">Connect wallet</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
              Connect Kaspa (L1) or EVM (L2) to use this dApp.
            </p>
          </div>
        </div>
      ) : null}
    </KxListingCard>

      {/* Modals */}
      {showInfoModal && (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={mergedDApp.contractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
    </>
  );
}

