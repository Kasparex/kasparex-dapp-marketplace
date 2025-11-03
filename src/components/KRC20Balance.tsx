/**
 * KRC-20 Token Balance Component
 * 
 * Displays user's KRC-20 token balance for a specific token
 */

'use client';

import { useKRC20Balance, useKRC20Token } from '@/hooks/useKRC20Balance';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { formatTokenBalance } from '@/lib/krc20/api';
import type { KRC20Balance } from '@/lib/krc20/types';

interface KRC20BalanceProps {
  tokenSymbol?: string;
  tokenAddress?: string;
  hideBalance?: boolean;
  showTokenInfo?: boolean;
}

export function KRC20Balance({ 
  tokenSymbol,
  tokenAddress,
  hideBalance = false,
  showTokenInfo = false 
}: KRC20BalanceProps) {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address ? kaspaState.address.replace(/^kaspa:/i, '') : undefined;

  // Fetch token data if symbol or address provided
  const { data: token } = useKRC20Token({
    symbol: tokenSymbol,
    address: tokenAddress,
    enabled: !!(tokenSymbol || tokenAddress),
  });

  // Fetch balances
  const { data: balances, isLoading, isError } = useKRC20Balance({
    address,
    enabled: !!address && kaspaState.isConnected,
  });

  // Find balance for this specific token
  const balance = balances?.find(b => 
    (tokenSymbol && b.symbol.toUpperCase() === tokenSymbol.toUpperCase()) ||
    (tokenAddress && b.tokenAddress.toLowerCase() === tokenAddress.toLowerCase())
  );

  if (!kaspaState.isConnected || !address) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Connect Kaspa wallet to view balance
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading balance...
      </div>
    );
  }

  if (isError || !balance) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {tokenSymbol || tokenAddress ? `No ${tokenSymbol || 'token'} balance` : 'No balance found'}
      </div>
    );
  }

  const formattedBalance = formatTokenBalance(balance.balance, balance.decimals);

  return (
    <div className="text-sm">
      {hideBalance ? (
        <div className="text-zinc-500 dark:text-zinc-400 select-none">
          •••••• {balance.symbol}
        </div>
      ) : (
        <div>
          <div className="text-zinc-900 dark:text-zinc-100 font-medium">
            {formattedBalance} {balance.symbol}
          </div>
          {showTokenInfo && balance.token && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {balance.token.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Component to display all KRC-20 token balances for connected wallet
 */
export function KRC20BalancesList() {
  const { state: kaspaState } = useKaspaWallet();
  const address = kaspaState.address ? kaspaState.address.replace(/^kaspa:/i, '') : undefined;

  const { data: balances, isLoading, isError } = useKRC20Balance({
    address,
    enabled: !!address && kaspaState.isConnected,
  });

  if (!kaspaState.isConnected || !address) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Connect Kaspa wallet to view balances
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Loading balances...
      </div>
    );
  }

  if (isError || !balances || balances.length === 0) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        No token balances found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {balances.map((balance) => (
        <div
          key={balance.tokenAddress}
          className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
        >
          <div className="flex-1">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {balance.symbol}
            </div>
            {balance.token && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {balance.token.name}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {balance.formattedBalance}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

