'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { DApp, generateSimulatedTicker, getDAppNetworkType } from '@/lib/dapps';
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

type SortField = 'name' | 'token' | 'category' | 'status' | 'version' | 'id';
type SortDirection = 'asc' | 'desc';

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
  
  // Get network type for badge
  const networkType = getDAppNetworkType(mergedDApp);
  const networkBadgeColor =
    networkType === 'L1'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="flex items-center">
          <DAppIcon
            dAppName={mergedDApp.name}
            category={mergedDApp.category}
            size={32}
            className="flex-shrink-0"
          />
        </Link>
      </td>
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="block">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {mergedDApp.name}
          </span>
        </Link>
      </td>
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {tokenTicker || 'N/A'}
          </span>
        </Link>
      </td>
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="block">
          {category && (
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {category.emoji} {category.name}
            </span>
          )}
        </Link>
      </td>
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="block">
          <StatusIndicator dapp={mergedDApp} size="sm" clickable={false} />
        </Link>
      </td>
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="block">
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${networkBadgeColor}`}
          >
            {networkType}
          </span>
        </Link>
      </td>
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="block">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            1.0.0
          </span>
        </Link>
      </td>
      <td className="py-4 px-4">
        <Link href={`/dapps/${slug}`} className="block">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            {mergedDApp.id}
          </span>
        </Link>
      </td>
    </tr>
  );
}

export function DAppTable({ dapps }: DAppTableProps) {
  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Sort dApps
  const sortedDApps = useMemo(() => {
    const sorted = [...dapps];
    
    sorted.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'token':
          // Token sorting would require contract data, so we'll sort by name as fallback
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          const aCategory = getCategoryById(a.category);
          const bCategory = getCategoryById(b.category);
          aValue = aCategory?.name || '';
          bValue = bCategory?.name || '';
          break;
        case 'status':
          const statusOrder: Record<string, number> = {
            Mainnet: 1,
            Testnet: 2,
            Suspended: 3,
          };
          aValue = statusOrder[a.status] || 999;
          bValue = statusOrder[b.status] || 999;
          break;
        case 'version':
          // All have version 1.0.0, so sort by name
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'id':
          const aId = parseInt(a.id, 10);
          const bId = parseInt(b.id, 10);
          if (!isNaN(aId) && !isNaN(bId)) {
            aValue = aId;
            bValue = bId;
          } else {
            aValue = a.id;
            bValue = b.id;
          }
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [dapps, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-zinc-400">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

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
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Logo
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort('name')}
            >
              Name
              <SortIcon field="name" />
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort('token')}
            >
              Token
              <SortIcon field="token" />
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort('category')}
            >
              Category
              <SortIcon field="category" />
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort('status')}
            >
              Status
              <SortIcon field="status" />
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort('network')}
            >
              Network
              <SortIcon field="network" />
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort('version')}
            >
              Version
              <SortIcon field="version" />
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => handleSort('id')}
            >
              ID
              <SortIcon field="id" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedDApps.map((dapp) => (
            <DAppTableRow key={dapp.id} dapp={dapp} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

