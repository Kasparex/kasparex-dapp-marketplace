'use client';

import { useMemo, useState } from 'react';
import { useChainId } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import { useDAppFromContract, mergeDAppData } from '@/lib/dapps/contractData';
import { getDAppContractAddress } from '@/lib/dapps/contractResolver';
import { useFavorites } from '@/hooks/useFavorites';
import { DAppInfoModal } from './DAppInfoModal';
import { DAppEmbed } from './DAppEmbed';
import { Tooltip } from '@/components/ui/Tooltip';
import { DAppVoteControls } from '@/components/dapps/DAppVoteControls';

interface DAppPageHeaderActionsProps {
  dapp: DApp;
  contractAddress?: string;
  className?: string;
}

export function DAppPageHeaderActions({ dapp, contractAddress, className = '' }: DAppPageHeaderActionsProps) {
  const chainId = useChainId();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  let resolvedContractAddress = contractAddress || dapp.contractAddress || '';
  if (!resolvedContractAddress) {
    resolvedContractAddress = getDAppContractAddress(dapp, chainId) || '';
  }

  const { data: contractData } = useDAppFromContract(
    resolvedContractAddress?.startsWith('0x') ? resolvedContractAddress : undefined,
    chainId,
  );
  const mergedDApp = mergeDAppData(contractData, dapp);

  const { toggleFavorite, isFavorite, isWalletConnected: isWalletConnectedForFavorites } = useFavorites();
  const isFavoriteDapp = isFavorite(mergedDApp.id);

  const btnClass =
    'p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors';

  return (
    <>
      <div className={`flex items-center gap-1 flex-shrink-0 ${className}`.trim()}>
        <Tooltip content="Full dApp details and listing info">
          <button type="button" onClick={() => setShowInfoModal(true)} className={btnClass} aria-label="View dApp info">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content="Embed this dApp on your site">
          <button type="button" onClick={() => setShowEmbedModal(true)} className={btnClass} aria-label="Get embed code">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </Tooltip>

        <Tooltip content={isWalletConnectedForFavorites ? (isFavoriteDapp ? 'Remove from favorites' : 'Save to favorites') : 'Connect wallet to favorite'}>
          <button
            type="button"
            onClick={() => {
              if (isWalletConnectedForFavorites) toggleFavorite(mergedDApp.id);
            }}
            className={`${btnClass} ${isFavoriteDapp ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
            disabled={!isWalletConnectedForFavorites}
            aria-label="Toggle favorite"
          >
            <svg className="w-4 h-4" fill={isFavoriteDapp ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </Tooltip>

        <DAppVoteControls dapp={mergedDApp} compact />
      </div>

      {showInfoModal ? (
        <DAppInfoModal
          dapp={mergedDApp}
          contractAddress={resolvedContractAddress}
          onClose={() => setShowInfoModal(false)}
        />
      ) : null}

      {showEmbedModal ? <DAppEmbed dapp={mergedDApp} onClose={() => setShowEmbedModal(false)} /> : null}
    </>
  );
}

export function useMergedDApp(dapp: DApp, contractAddress?: string) {
  const chainId = useChainId();
  let resolved = contractAddress || dapp.contractAddress || '';
  if (!resolved) resolved = getDAppContractAddress(dapp, chainId) || '';
  const { data: contractData } = useDAppFromContract(
    resolved?.startsWith('0x') ? resolved : undefined,
    chainId,
  );
  return useMemo(() => ({ mergedDApp: mergeDAppData(contractData, dapp), contractAddress: resolved }), [contractData, dapp, resolved]);
}
