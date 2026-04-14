'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount, useChainId } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { DApp, generateSimulatedTicker, getDAppChainIds, getDAppNetworkType, isDAppCompatibleWithChain } from '@/lib/dapps';
import { getCategoryById } from '@/lib/categories';
import { generateDAppSlug } from '@/lib/utils';
import { StatusIndicator } from './dapps/StatusIndicator';
import { mergeDAppData, useDAppFromContract } from '@/lib/dapps/contractData';
import { DAppIcon } from './dapps/DAppIcon';
import { getContractAddress } from '@/lib/contracts/addresses';
import { getChainById } from '@/lib/wagmi';

interface DAppTableProps {
  dapps: DApp[];
  selectedNetwork?: 'all' | 'L1' | 'L2';
}

interface DAppTableRowProps {
  dapp: DApp;
  selectedNetwork?: 'all' | 'L1' | 'L2';
}

type SortField = 'name' | 'token' | 'category' | 'status' | 'network' | 'version' | 'id';
type SortDirection = 'asc' | 'desc';

function DAppTableRow({ dapp, selectedNetwork = 'all' }: DAppTableRowProps) {
  const chainId = useChainId();
  const { isConnected: isEvmConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
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
  
  // Get token information
  // For L1 dApps, use special token mappings (Send KAS -> KAS, Send KREX -> KREX)
  const isL1DApp = getDAppNetworkType(mergedDApp) === 'L1';
  let rawTicker: string | null = null;
  if (isL1DApp) {
    // L1 dApps: map to actual tokens
    if (mergedDApp.slug === 'send-kas' || mergedDApp.name.toLowerCase().includes('send kas')) {
      rawTicker = 'KAS';
    } else if (mergedDApp.slug === 'send-krex' || mergedDApp.name.toLowerCase().includes('send krex')) {
      rawTicker = 'KREX';
    }
  } else {
    // L2 dApps: use contract data or generate
    rawTicker = contractData?.ticker || generateSimulatedTicker(mergedDApp.name);
  }
  const tokenTicker = rawTicker ? rawTicker.substring(0, 6) : null;
  
  // Get network type for badge
  const networkType = getDAppNetworkType(mergedDApp);
  const networkBadgeColor =
    networkType === 'L1'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';

  const isNetworkMismatch = selectedNetwork !== 'all' && networkType !== selectedNetwork;
  const requiredChainIds = useMemo(() => getDAppChainIds(mergedDApp), [mergedDApp]);
  const requiredChainNames = useMemo(
    () => requiredChainIds.map((id) => getChainById(id)?.name || `Chain ${id}`),
    [requiredChainIds]
  );
  const isL2ChainCompatible = useMemo(() => {
    if (networkType !== 'L2') return true;
    if (!isEvmConnected || chainId === undefined) return false;
    return isDAppCompatibleWithChain(mergedDApp, chainId);
  }, [networkType, isEvmConnected, chainId, mergedDApp]);

  const isOpenable =
    !isNetworkMismatch &&
    (networkType === 'L1'
      ? kaspaState.isConnected
      : isEvmConnected && chainId !== undefined && isL2ChainCompatible);

  const gateHint = isNetworkMismatch
    ? 'Not available for this filter'
    : networkType === 'L1'
      ? 'Connect L1 wallet'
      : !isEvmConnected
        ? 'Connect L2 wallet'
        : !isL2ChainCompatible
          ? `Switch to ${requiredChainNames.join(' or ')}`
          : '';
  
  return (
    <tr
      className={`border-b border-zinc-100 dark:border-zinc-800 transition-colors ${
        isOpenable ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50' : 'opacity-95'
      }`}
    >
      <td className="py-4 px-4">
        {isOpenable ? (
          <Link href={`/dapps/${slug}`} className="flex items-center">
            <DAppIcon
              dAppName={mergedDApp.name}
              category={mergedDApp.category}
              size={32}
              className="flex-shrink-0"
            />
          </Link>
        ) : (
          <div className="flex items-center cursor-not-allowed">
            <DAppIcon
              dAppName={mergedDApp.name}
              category={mergedDApp.category}
              size={32}
              className="flex-shrink-0"
            />
          </div>
        )}
      </td>
      <td className="py-4 px-4">
        {isOpenable ? (
          <Link href={`/dapps/${slug}`} className="block">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {mergedDApp.name}
            </span>
          </Link>
        ) : (
          <div className="block cursor-not-allowed">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {mergedDApp.name}
            </span>
            {gateHint ? (
              <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {gateHint}
              </div>
            ) : null}
          </div>
        )}
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">GRID</span>
      </td>
      <td className="py-4 px-4">
        {category && (
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {category.emoji} {category.name}
          </span>
        )}
      </td>
      <td className="py-4 px-4">
        <StatusIndicator dapp={mergedDApp} size="sm" clickable={false} />
      </td>
      <td className="py-4 px-4">
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${networkBadgeColor}`}
        >
          {networkType}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">1.0.0</span>
      </td>
      <td className="py-4 px-4">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {mergedDApp.id}
        </span>
      </td>
    </tr>
  );
}

export function DAppTable({ dapps, selectedNetwork = 'all' }: DAppTableProps) {
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
        case 'network':
          const aNetworkType = getDAppNetworkType(a);
          const bNetworkType = getDAppNetworkType(b);
          aValue = aNetworkType;
          bValue = bNetworkType;
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
              Rewards
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
            <DAppTableRow key={dapp.id} dapp={dapp} selectedNetwork={selectedNetwork} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

