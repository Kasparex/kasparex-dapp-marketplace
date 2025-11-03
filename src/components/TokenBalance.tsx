'use client';

import { useBalance } from 'wagmi';
import { formatUnits, type Address } from 'viem';

interface TokenBalanceProps {
  address: Address | undefined;
  hideBalance?: boolean;
}

export function TokenBalance({ address, hideBalance = false }: TokenBalanceProps) {
  const { data: balance, isLoading, isError } = useBalance({
    address: address,
  });

  if (!address) {
    return (
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        Connect wallet to view balance
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
      <div className="text-sm text-red-500 dark:text-red-400">
        Error loading balance
      </div>
    );
  }

  const formattedBalance = formatUnits(balance.value, balance.decimals);
  const displayBalance = parseFloat(formattedBalance).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  return (
    <div className="text-sm">
      {hideBalance ? (
        <div className="text-zinc-500 dark:text-zinc-400 select-none">
          •••••• {balance.symbol}
        </div>
      ) : (
        <div className="text-zinc-900 dark:text-zinc-100 font-medium">
          {displayBalance} {balance.symbol}
        </div>
      )}
    </div>
  );
}

