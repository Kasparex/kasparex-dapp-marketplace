/**
 * Token Balance Display
 * Shows user's wallet balance for the token
 */

'use client';

import { useAccount } from 'wagmi';
import type { Token } from '@/lib/tokens/types';
import { TokenLogo } from './TokenLogo';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useKaspaTokenBalance } from '@/hooks/useKaspaTokenBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

interface TokenBalanceDisplayProps {
  token: Token;
}

export function TokenBalanceDisplay({ token }: TokenBalanceDisplayProps) {
  const { address, isConnected } = useAccount();

  // Get balance based on token type and network
  const l2Balance = useTokenBalance(
    token.network === 'L2' && token.contractAddress ? token.contractAddress : null
  );
  const l1Balance = useKaspaTokenBalance(
    token.network === 'L1' ? token.symbol : null
  );
  const { balance: krexBalance } = useKREXBalance();

  if (!isConnected || !address) {
    return (
      <section id="balance" className="space-y-6">
        <DAppSectionHeader title="Your Balance" />
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Connect your wallet to view your token balance
          </p>
        </div>
      </section>
    );
  }

  // Determine which balance to show
  let displayBalance: number = 0;
  let isLoading = false;

  if (token.id === 'krex') {
    displayBalance = krexBalance;
  } else if (token.network === 'L2') {
    displayBalance = l2Balance.balanceNumber;
    isLoading = l2Balance.isLoading;
  } else if (token.network === 'L1') {
    displayBalance = l1Balance.balance;
    isLoading = l1Balance.isLoading;
  }

  return (
    <section id="balance" className="space-y-6">
      <DAppSectionHeader title="Your Balance" />

      <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        {isLoading ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400">Loading balance...</div>
        ) : (
          <div className="text-center">
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {formatLargeNumber(displayBalance)}
            </div>
            <div className="flex items-center justify-center gap-2">
              <TokenLogo token={token} size={24} showSymbol={true} showName={false} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
