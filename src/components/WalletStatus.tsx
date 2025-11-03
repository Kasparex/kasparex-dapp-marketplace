/**
 * Unified Wallet Status Component
 * 
 * Displays both EVM and Kaspa wallet connection status
 */

'use client';

import { useAccount } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatKaspaAddress } from '@/lib/kaspa/wallet';
import { formatUnits } from 'viem';
import { useBalance } from 'wagmi';

export function WalletStatus() {
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const { data: evmBalance } = useBalance({
    address: evmAddress,
    query: {
      enabled: isEVMConnected,
    },
  });

  const kaspaAddressDisplay = kaspaState.address
    ? formatKaspaAddress(kaspaState.address)
    : null;

  return (
    <div className="space-y-3">
      {/* EVM Wallet Status */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            EVM Wallet
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              isEVMConnected
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {isEVMConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {isEVMConnected && evmAddress ? (
          <div className="space-y-1">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              {`${evmAddress.substring(0, 6)}...${evmAddress.substring(evmAddress.length - 4)}`}
            </div>
            {evmBalance && (
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {parseFloat(formatUnits(evmBalance.value, evmBalance.decimals)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}{' '}
                {evmBalance.symbol}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Connect an EVM wallet to use Kasplex L2 dApps
          </div>
        )}
      </div>

      {/* Kaspa Wallet Status */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Kaspa Wallet
          </span>
          <span
            className={`text-xs px-2 py-1 rounded ${
              kaspaState.isConnected
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {kaspaState.isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {kaspaState.isConnected && kaspaAddressDisplay ? (
          <div className="space-y-1">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
              {kaspaAddressDisplay.display}
            </div>
            {kaspaState.provider && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {kaspaState.provider.charAt(0).toUpperCase() + kaspaState.provider.slice(1)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Connect a Kaspa wallet to use KRC-20 tokens and native L1 dApps
          </div>
        )}
      </div>
    </div>
  );
}

