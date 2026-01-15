'use client';

import { useAccount, useReadContract } from 'wagmi';
import { DAPP_TOKEN_ABI } from '@/lib/contracts/abis';

interface DAppTokenBalanceRowProps {
  dappId: string;
  dappName: string;
  contractAddress: string;
}

export function DAppTokenBalanceRow({
  dappId,
  dappName,
  contractAddress,
}: DAppTokenBalanceRowProps) {
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: DAPP_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address && !!contractAddress,
      refetchInterval: 30000,
    },
  }) as { data: bigint | undefined; isLoading: boolean };

  // Extract ticker from dApp name or use a default
  const ticker = dappName
    .replace(/\s+/g, '')
    .substring(0, 6)
    .toUpperCase() || 'TOKEN';

  const formattedBalance = balance
    ? (Number(balance) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
        {dappName}
      </td>
      <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
        {ticker}
      </td>
      <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
        {isLoading ? (
          <span className="text-zinc-400">Loading...</span>
        ) : (
          <span className={Number(balance || 0) > 0 ? 'text-[#02abb8]' : 'text-zinc-400'}>
            {formattedBalance}
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-sm">
        {contractAddress ? (
          <a
            href={`https://explorer.kasplex.com/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#02abb8] hover:underline"
          >
            {`${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`}
          </a>
        ) : (
          <span className="text-zinc-400">—</span>
        )}
      </td>
    </tr>
  );
}
