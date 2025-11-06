'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { DApp, type DAppStatus, getDAppChainIds } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { useLikes } from '@/hooks/useLikes';
import { useFavorites } from '@/hooks/useFavorites';
import { getChainById } from '@/lib/wagmi';
import { isDeployer } from '@/lib/dapps/deployer';
import { DAppInfoModal } from './dapps/DAppInfoModal';
import { DAppGuideAndInfoModal } from './dapps/DAppGuideAndInfoModal';
import { DAppEmbed } from './dapps/DAppEmbed';
import { DAppThemeSwitcherModal } from './dapps/DAppThemeSwitcherModal';
import { EditDAppModal } from './dapps/EditDAppModal';

interface DAppCardProps {
  dapp: DApp;
}

const statusColors: Record<DAppStatus, string> = {
  Mainnet: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
  Testnet: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  Concept: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700',
  Prototype: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  'U/C': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  Suspended: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  Devnet: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
};

export function DAppCard({ dapp }: DAppCardProps) {
  const category = getCategoryById(dapp.category);
  const slug = dapp.slug || generateDAppSlug(dapp.name);
  const { address: connectedAddress } = useAccount();
  const { toggleLike, getLikeCount, hasLiked, isWalletConnected: isWalletConnectedForLikes } = useLikes();
  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const likeCount = getLikeCount(dapp.id);
  const isLiked = hasLiked(dapp.id);
  const isFavoriteDapp = isFavorite(dapp.id);

  // Modal states
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showGuideAndInfoModal, setShowGuideAndInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNetworkTooltip, setShowNetworkTooltip] = useState(false);

  // Get network information
  const supportedChainIds = getDAppChainIds(dapp);
  const supportedNetworks = supportedChainIds
    .map(id => getChainById(id))
    .filter(Boolean)
    .map(chain => chain!.name);

  // Check if user is deployer
  const DEFAULT_DEPLOYER = '0x658420Fd88dbd610249a88384f9B1aD387F797c7';
  const deployerAddress = dapp.deployerAddress || 
    (dapp.developer && dapp.developer.startsWith('0x') ? dapp.developer : '') || 
    DEFAULT_DEPLOYER;
  const isDeployerUser = isDeployer(connectedAddress, deployerAddress);

  const handleIconClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <Link
      href={`/dapps/${slug}`}
      className="block w-full text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
    >
      <div className="flex items-start gap-4">
        {dapp.image ? (
          <div className="flex-shrink-0 relative w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <Image
              src={dapp.image}
              alt={dapp.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-2xl">{category?.emoji || '⚡'}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-1 min-w-0">
              {dapp.name}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <span
                  className={`
                    px-2 py-1 text-xs font-medium rounded border cursor-help
                    ${statusColors[dapp.status] || statusColors.Concept}
                  `}
                  onMouseEnter={() => setShowNetworkTooltip(true)}
                  onMouseLeave={() => setShowNetworkTooltip(false)}
                >
                  {dapp.status}
                </span>
                {showNetworkTooltip && supportedNetworks.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-[100] p-3 pointer-events-none">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Available Networks:
                    </p>
                    <ul className="space-y-1">
                      {supportedNetworks.map((network, index) => (
                        <li key={index} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="truncate">{network}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {dapp.status === 'Testnet' && (
                <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                  Testnet Only
                </span>
              )}
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
                {dapp.id}
              </span>
            </div>
          )}

          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {dapp.utility}
          </p>
        </div>
      </div>

      {/* Icon Links Section at Bottom */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Star Button (Favorites) */}
          <button
            onClick={(e) => handleIconClick(e, () => {
              if (isWalletConnectedForFavorites) {
                toggleFavorite(dapp.id);
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
                toggleLike(dapp.id);
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

          {/* Info Icon */}
          {(dapp.description || dapp.utility) && (
            <button
              onClick={(e) => handleIconClick(e, () => setShowInfoModal(true))}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Description"
              aria-label="View description"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          {/* Guide & Info Icon */}
          <button
            onClick={(e) => handleIconClick(e, () => setShowGuideAndInfoModal(true))}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="How to Use & Additional Information"
            aria-label="View guide and additional information"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Embed Icon */}
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

          {/* Theme Switcher Icon */}
          <button
            onClick={(e) => handleIconClick(e, () => setShowThemeModal(true))}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Page Theme"
            aria-label="Change page theme"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>

          {/* Edit Button (Deployers only) */}
          {isDeployerUser && (
            <button
              onClick={(e) => handleIconClick(e, () => setShowEditModal(true))}
              className="px-2 py-1 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              title="Edit dApp"
              aria-label="Edit dApp"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showInfoModal && (
        <DAppInfoModal
          dapp={dapp}
          contractAddress={dapp.contractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      )}
      {showGuideAndInfoModal && (
        <DAppGuideAndInfoModal
          dapp={dapp}
          isOpen={showGuideAndInfoModal}
          onClose={() => setShowGuideAndInfoModal(false)}
        />
      )}
      {showEmbedModal && (
        <DAppEmbed
          dapp={dapp}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
      {showThemeModal && (
        <DAppThemeSwitcherModal
          dapp={dapp}
          isOpen={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />
      )}
      {showEditModal && (
        <EditDAppModal
          dapp={dapp}
          contractAddress={dapp.contractAddress}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </Link>
  );
}

