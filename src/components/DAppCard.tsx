'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, generateSimulatedAddress, getDAppNetworkType } from '@/lib/dapps';
import { getCategoryById, Category } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppInfoModal } from './dapps/DAppInfoModal';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DAppFeesModal } from './dapps/DAppFeesModal';
import { StatusIndicator } from './dapps/StatusIndicator';
import { getStatusTypeFromString } from './dapps/StatusIndicatorDot';

interface DAppCardProps {
  dapp: DApp;
}

/**
 * Category Icon Component - matches sidebar menu icons
 */
function CategoryIcon({ id, className = '' }: { id: Category; className?: string }) {
  const iconProps = { className: `w-4 h-4 ${className}`, strokeWidth: 2, fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor' as const };
  switch (id) {
    case 'all': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'tracker': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
    case 'general': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    case 'minting': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
    case 'defi': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case 'games': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m-7-4h12M5 15a3 3 0 11-6 0 3 3 0 016 0zm6 5a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M11 20.9l-6-6M4.5 12.5l5 5" /></svg>;
    case 'promotion': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A1.76 1.76 0 015 15.066V15c0 .115.022.23.064.338a.98.98 0 00.936.662H9c.552 0 1 .448 1 1s-.448 1-1 1H7.618a2 2 0 01-1.789-1.106l-.53-.1.53.1zm14.11-6.191A1.76 1.76 0 0021 6.096V6c0-.115-.022-.23-.064-.338a.98.98 0 00-.936-.662H15c-.552 0-1-.448-1-1s.448-1 1-1h1.382a2 2 0 001.789-1.106l.53.1-.53-.1z" /></svg>;
    case 'subscription': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    case 'dao': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    case 'tools': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case 'collabs': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    case 'airdrops': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
    case 'payment': return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
    default: return <svg {...iconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
  }
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

  // Get network type for badge
  const networkType = getDAppNetworkType(mergedDApp);
  const networkBadgeColor =
    networkType === 'L1'
      ? 'bg-[#02abb8]/20 dark:bg-[#02abb8]/30 text-[#02abb8] border-[#02abb8]/30 dark:border-[#02abb8]/50'
      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';

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
    <Link
      href={`/dapps/${slug}`}
      className="group block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-[#02abb8]/10 hover:border-[#02abb8]/30 hover:-translate-y-2 transition-all duration-500 relative flex flex-col min-h-[360px]"
    >
      {/* Featured Image Banner */}
      {(mergedDApp.featuredImage || mergedDApp.image) ? (
        <div className="relative w-full h-40 overflow-hidden border-b border-zinc-200/50 dark:border-zinc-800/50 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 transition-all duration-700 group-hover:scale-[1.05]">
          <img
            src={mergedDApp.featuredImage || mergedDApp.image}
            alt={mergedDApp.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          
          {/* Dot Indicator - Top Right Corner */}
          <div className="absolute top-3 right-3 z-20">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor()} ring-2 ring-white dark:ring-zinc-900 shadow-sm`} />
          </div>
        </div>
      ) : (
        <div className="relative w-full h-40 overflow-hidden border-b border-zinc-200/50 dark:border-zinc-800/50 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 transition-all duration-700 group-hover:scale-[1.05] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
          
          {/* Profile Picture as Fallback */}
          <DAppIcon
            dAppName={mergedDApp.name}
            category={mergedDApp.category}
            size={80}
            className="relative z-10 opacity-50 group-hover:opacity-90 transition-all duration-700 transform group-hover:scale-125 group-hover:rotate-6"
          />
          
          {/* Dot Indicator - Top Right Corner */}
          <div className="absolute top-3 right-3 z-20">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor()} ring-2 ring-white dark:ring-zinc-900 shadow-sm`} />
          </div>
        </div>
      )}

      <div className="p-6 relative z-10 flex flex-col flex-1 min-h-0">
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
                className="text-lg font-black text-zinc-900 dark:text-zinc-100 group-hover:text-[#02abb8] transition-colors duration-300 flex-1 truncate"
                title={mergedDApp.name}
              >
                {mergedDApp.name}
              </h3>

              {/* Network Indicator - Subtle, Right Side */}
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
              </div>
            </div>

            {/* Reward Token - Text Only, No Badge */}
            {tokenTicker && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-[#02abb8]">{tokenTicker}</span>
                <span className="ml-1">Reward Token</span>
              </div>
            )}
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

              {/* Version - Consistent Box Size */}
              {mergedDApp.version && mergedDApp.version !== 'N/A' && (
                <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                  v{mergedDApp.version.replace(/^v\s*/i, '')}
                </div>
              )}

              {/* dApp ID - Consistent Box Size */}
              <div className="px-3 py-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
                {mergedDApp.id}
              </div>
            </div>

            {/* Right: Star, Heart, and Open Button */}
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

              {/* Open dApp Arrow Button */}
              <div className="text-[#02abb8] opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
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

