/**
 * Network Selector Component
 * Allows switching between EVM L2 and vProgs L1
 */

'use client';

import { useState } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { CHAIN_IDS, isChainSupported } from '@/lib/wagmi';
import { isVProgsNetwork } from '@/lib/contracts/factory';
import { L2ChainConnectLabel } from '@/components/wallet/L2ChainLogo';

export interface NetworkSelectorProps {
  className?: string;
}

export function NetworkSelector({ className = '' }: NetworkSelectorProps) {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);

  const currentIsVProgs = isVProgsNetwork(chainId);

  const networks = [
    {
      id: CHAIN_IDS.KASPLEX_L2_MAINNET,
      name: 'Kasplex Mainnet',
      type: 'EVM',
      isVProgs: false,
    },
    {
      id: CHAIN_IDS.KASPLEX_L2_TESTNET,
      name: 'Kasplex Testnet',
      type: 'EVM',
      isVProgs: false,
    },
    {
      id: CHAIN_IDS.IGRA_GALLEON_TESTNET,
      name: 'Igra Testnet',
      type: 'EVM',
      isVProgs: false,
    },
    {
      id: CHAIN_IDS.IGRA_MAINNET,
      name: 'Igra Mainnet',
      type: 'EVM',
      isVProgs: false,
    },
    {
      id: CHAIN_IDS.VPROGS_TESTNET,
      name: 'Kaspa vProgs Testnet',
      type: 'vProgs',
      isVProgs: true,
      disabled: true, // Not available yet
    },
    {
      id: CHAIN_IDS.VPROGS_MAINNET,
      name: 'Kaspa vProgs Mainnet',
      type: 'vProgs',
      isVProgs: true,
      disabled: true, // Not available yet
    },
  ];

  const currentNetwork = networks.find((n) => n.id === chainId);

  const handleSwitch = (targetChainId: number) => {
    if (switchChain) {
      switchChain({ chainId: targetChainId });
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
      >
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {currentNetwork?.name || 'Unknown Network'}
        </span>
        <span
          className={`px-2 py-0.5 text-xs rounded ${
            currentIsVProgs
              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
          }`}
        >
          {currentIsVProgs ? 'vProgs' : 'EVM'}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-20 w-64 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="p-2">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => !network.disabled && handleSwitch(network.id)}
                  disabled={network.disabled || network.id === chainId || isPending}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    network.id === chainId
                      ? 'bg-[#02abb8] text-white'
                      : network.disabled
                      ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <L2ChainConnectLabel chainId={network.id} chainName={network.name} label={network.name} logoSize={20} />
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${
                        network.isVProgs
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      }`}
                    >
                      {network.type}
                    </span>
                  </div>
                  {network.disabled && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
                      Coming soon
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

