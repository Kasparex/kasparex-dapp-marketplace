'use client';

import { useAccount, useChainId } from 'wagmi';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DApp } from '@/lib/dapps';
import { getChainById } from '@/lib/wagmi';
import { useNetworkCompatibility } from '@/hooks/useNetworkCompatibility';

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

  return (
    <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
        Network Availability
      </h3>
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
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium text-center ${
                compatibility.isCompatible
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
              }`}>
                {compatibility.isCompatible ? '✓ Compatible' : '⚠ Not compatible'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

