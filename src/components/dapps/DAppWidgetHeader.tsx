'use client';

import { useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { DApp, getDAppChainIds, getDAppNetworkType, isDAppCompatibleWithChain } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { DAppInfoModal } from './DAppInfoModal';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppEmbed } from './DAppEmbed';
import { getChainById } from '@/lib/wagmi';

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
  const { isConnected: isEvmConnected } = useAccount();

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
  const isTestnetDApp =
    statusLower === 'testnet' ||
    (mergedDApp.network || '').toLowerCase().includes('testnet') ||
    (mergedDApp.network || '').toLowerCase().includes('galleon') ||
    (mergedDApp.name || '').toLowerCase().includes('testnet');

  const statusType: 'mainnet' | 'testnet' | 'suspended' | 'none' = useMemo(() => {
    if (statusLower === 'suspended') return 'suspended';
    if (statusLower === 'testnet' || isTestnetDApp) return 'testnet';
    if (statusLower === 'mainnet') return 'mainnet';
    return 'none';
  }, [isTestnetDApp, statusLower]);

  const statusLabel = useMemo(() => {
    const status = (mergedDApp.status || '').toLowerCase();
    const env = status === 'testnet' || isTestnetDApp ? 'Testnet' : status === 'mainnet' ? 'Mainnet' : mergedDApp.status;
    if (!env) return '';
    if (env === 'Suspended') return 'Suspended';

    const lower = (mergedDApp.network || '').toLowerCase();
    if (networkType === 'L2') {
      const family = lower.includes('igra') ? 'Igra' : lower.includes('kasplex') ? 'Kasplex' : 'L2';
      return `${family} ${env}`;
    }
    const family = lower.includes('kaspa') ? 'Kaspa' : 'L1';
    return `${family} ${env}`;
  }, [isTestnetDApp, mergedDApp.network, mergedDApp.status, networkType]);

  const requiredChainIds = useMemo(() => getDAppChainIds(mergedDApp), [mergedDApp]);
  const requiredChainNames = useMemo(
    () => requiredChainIds.map((id) => getChainById(id)?.name || `Chain ${id}`),
    [requiredChainIds]
  );

  const isL2ChainCompatible = useMemo(() => {
    if (networkType !== 'L2') return true;
    if (!isEvmConnected || chainId === undefined) return false;
    return isDAppCompatibleWithChain(mergedDApp, chainId);
  }, [chainId, isEvmConnected, mergedDApp, networkType]);

  const primaryRequiredChainName = useMemo(() => {
    const unique = Array.from(new Set(requiredChainNames));
    if (unique.length === 0) return '';
    const score = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('mainnet')) return 0;
      if (n.includes('testnet')) return 2;
      return 1;
    };
    return [...unique].sort((a, b) => score(a) - score(b) || a.localeCompare(b))[0] || unique[0];
  }, [requiredChainNames]);

  const activeChain = useMemo(() => (chainId ? getChainById(chainId) : null), [chainId]);

  const badgeNetworkLabel = useMemo(() => {
    if (networkType === 'L2') {
      if (isEvmConnected && chainId !== undefined && isL2ChainCompatible) {
        return activeChain?.name || `Chain ${chainId}`;
      }
      return primaryRequiredChainName || mergedDApp.network || 'L2';
    }

    const nice = statusLabel || (networkType === 'L1' ? 'Kaspa' : mergedDApp.network ? mergedDApp.network : 'L1');
    return nice.replace(/^(L1|L2)\s+/i, '');
  }, [
    activeChain?.name,
    chainId,
    isEvmConnected,
    isL2ChainCompatible,
    mergedDApp.network,
    networkType,
    primaryRequiredChainName,
    statusLabel,
  ]);

  const badgeKind = useMemo(() => {
    if (networkType === 'L1') {
      const lower = badgeNetworkLabel.toLowerCase();
      if (lower.includes('kaspa') && lower.includes('mainnet')) return 'kaspa_mainnet';
      if (
        lower.includes('kaspa') &&
        (lower.includes('testnet') || lower.includes('vprogs') || lower.includes('simulator'))
      )
        return 'kaspa_testnet';
      return statusType === 'testnet' ? 'kaspa_testnet' : statusType === 'mainnet' ? 'kaspa_mainnet' : 'neutral';
    }

    if (networkType === 'L2') {
      if (isEvmConnected && chainId !== undefined && isL2ChainCompatible) {
        return activeChain?.testnet ? 'l2_testnet' : 'l2_mainnet';
      }
      const lower = badgeNetworkLabel.toLowerCase();
      if (lower.includes('testnet')) return 'l2_testnet';
      if (lower.includes('mainnet')) return 'l2_mainnet';
      return statusType === 'testnet' ? 'l2_testnet' : statusType === 'mainnet' ? 'l2_mainnet' : 'neutral';
    }

    return 'neutral';
  }, [
    activeChain?.testnet,
    badgeNetworkLabel,
    chainId,
    isEvmConnected,
    isL2ChainCompatible,
    networkType,
    statusType,
  ]);

  const badgeClassName = useMemo(() => {
    if (badgeKind === 'kaspa_mainnet') {
      return 'bg-cyan-500/10 text-[#028f9a] dark:text-[#70C7BA] border border-cyan-500/25';
    }
    if (badgeKind === 'kaspa_testnet') {
      return 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-700/60';
    }
    if (badgeKind === 'l2_testnet') {
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300/50 dark:border-yellow-600/40';
    }
    if (badgeKind === 'l2_mainnet') {
      return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-600/40';
    }
    if (statusType === 'suspended') {
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300/50 dark:border-red-600/40';
    }
    return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300/50 dark:border-zinc-700/60';
  }, [badgeKind, statusType]);

  const headerAdditionalNetworks = useMemo(() => {
    if (networkType !== 'L2') return [];
    const unique = Array.from(new Set(requiredChainNames));
    return unique.filter((n) => n && n !== badgeNetworkLabel);
  }, [badgeNetworkLabel, networkType, requiredChainNames]);

  return (
    <>
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex flex-wrap items-center gap-2">
            <div className="relative inline-flex group">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm ${badgeClassName}`}>
                {networkType === 'L1' ? 'L1' : 'L2'}
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                </svg>
                {badgeNetworkLabel}
              </span>

              {headerAdditionalNetworks.length > 0 ? (
                <div className="pointer-events-none absolute left-0 top-full z-40 mt-2 hidden w-max max-w-[260px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-lg group-hover:block dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">Also available on</div>
                  <ul className="mt-1 space-y-0.5">
                    {headerAdditionalNetworks.map((n) => (
                      <li key={n} className="whitespace-nowrap">
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
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
