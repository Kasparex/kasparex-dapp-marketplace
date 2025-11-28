'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { StatusIndicator } from './dapps/StatusIndicator';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { getContractAddress } from '@/lib/contracts/addresses';

interface DAppTableProps {
  dapps: DApp[];
}

interface DAppTableRowProps {
  dapp: DApp;
}

function DAppTableRow({ dapp }: DAppTableRowProps) {
  const chainId = useChainId();
  const mergedDApp = mergeDAppData(null, dapp);
  const category = getCategoryById(mergedDApp.category);
  const slug = mergedDApp.slug || generateDAppSlug(mergedDApp.name);
  
  // Get contract data for token information
  let contractAddress = mergedDApp.contractAddress || '';
  if (!contractAddress) {
    contractAddress = getContractAddress(chainId, 'DAppRegistry') || '';
  }
  const { data: contractData } = useDAppFromContract(
    contractAddress?.startsWith('0x') ? contractAddress : undefined,
    chainId
  );
  
  const rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
  const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;
  
  return (
    <Link
      href={`/dapps/${slug}`}
      className="table-row border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
    >
      <td className="py-3 px-4">
        <DAppIcon
          dAppName={mergedDApp.name}
          category={mergedDApp.category}
          size={32}
          className="flex-shrink-0"
        />
      </td>
      <td className="py-3 px-4">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {mergedDApp.name}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {tokenTicker || 'N/A'}
        </span>
      </td>
      <td className="py-3 px-4">
        {category && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {category.emoji} {category.name}
          </span>
        )}
      </td>
      <td className="py-3 px-4">
        <StatusIndicator dapp={mergedDApp} size="sm" clickable={false} />
      </td>
      <td className="py-3 px-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          1.0.0
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {mergedDApp.id}
        </span>
      </td>
    </Link>
  );
}

export function DAppTable({ dapps }: DAppTableProps) {
  if (dapps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No dApps found in this category.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Logo</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Name</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Token</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Category</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Version</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">ID</th>
          </tr>
        </thead>
        <tbody>
          {dapps.map((dapp) => (
            <DAppTableRow key={dapp.id} dapp={dapp} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

