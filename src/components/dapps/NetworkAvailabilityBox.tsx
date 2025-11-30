'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useChainId } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp, getDAppChainIds } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';
import { CHAIN_IDS } from '@/lib/wagmi';

interface NetworkAvailabilityBoxProps {
  dapp: DApp;
  accentColor?: string;
}

export function NetworkAvailabilityBox({ dapp, accentColor = '#02abb8' }: NetworkAvailabilityBoxProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { openChainModal } = useChainModal();
  const chain = chainId ? getChainById(chainId) : null;
  const isTestnet = chain?.testnet ?? false;
  const isMainnet = !isTestnet;
  const compatibility = useNetworkCompatibility(dapp);

  const [showModal, setShowModal] = useState(false);
  
  // Get network information for modal
  const supportedChainIds = getDAppChainIds(dapp);
  const supportedNetworks = supportedChainIds
    .map(id => getChainById(id))
    .filter(Boolean)
    .map(chain => chain!.name);
  
  const allChainIds = [CHAIN_IDS.KASPLEX_L2_MAINNET, CHAIN_IDS.KASPLEX_L2_TESTNET, CHAIN_IDS.VPROGS_TESTNET, CHAIN_IDS.VPROGS_MAINNET];
  const allNetworks = allChainIds
    .map(id => getChainById(id))
    .filter(Boolean)
    .map(chain => chain!.name);
  const unavailableNetworks = allNetworks.filter(network => !supportedNetworks.includes(network));

  return (
    <div className="mb-6">
      <div className="space-y-2">
        {!isConnected && (
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => {
              const ready = mounted;
              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  <button
                    onClick={openConnectModal}
                    type="button"
                    style={{ 
                      backgroundColor: accentColor === '#02abb8' ? '#0097b2' : accentColor
                    }}
                    className="w-full px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Connect Wallet
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        )}

        {isConnected && (
          <>
            <button
              onClick={() => openChainModal?.()}
              className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm font-medium flex items-center justify-between ${
                isMainnet
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/40'
                  : isTestnet
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              aria-label="Switch network"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>
                <span className="text-xs">{chain?.name || 'Switch Network'}</span>
              </div>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isConnected && (
              <button
                onClick={() => setShowModal(true)}
                className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium text-center cursor-pointer transition-colors ${
                  compatibility.isCompatible
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
                }`}
              >
                {compatibility.isCompatible ? '✓ Compatible' : '⚠ Not compatible'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Network Availability Modal */}
      {showModal && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          
          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Network Availability
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Available networks for {dapp.name}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {dapp.status === 'Suspended' && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    ⚠ Suspended
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    This dApp is currently suspended and not available on any network.
                  </p>
                </div>
              )}
              
              {supportedNetworks.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Available Networks:
                  </p>
                  <ul className="space-y-2">
                    {supportedNetworks.map((network, index) => (
                      <li key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{network}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {unavailableNetworks.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Not Available Networks:
                  </p>
                  <ul className="space-y-2">
                    {unavailableNetworks.map((network, index) => (
                      <li key={index} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                        <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{network}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {supportedNetworks.length === 0 && unavailableNetworks.length === 0 && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No networks configured
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

