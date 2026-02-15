/**
 * Token Listing Table Component
 * Filterable and sortable table with wallet balance integration
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import type { Token, TokenNetwork, TokenType } from '@/lib/tokens/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useKaspaTokenBalance } from '@/hooks/useKaspaTokenBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { getTokenImageUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface TokenListingTableProps {
  tokens: Token[];
}

type SortField = 'name' | 'symbol' | 'price' | 'marketCap' | 'balance' | 'network' | 'type';
type SortDirection = 'asc' | 'desc';

export function TokenListingTable({ tokens }: TokenListingTableProps) {
  const { address, isConnected } = useAccount();
  const { balance: krexBalance } = useKREXBalance();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<TokenNetwork | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TokenType | 'all'>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter and sort tokens
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter((token) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          token.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Network filter
      if (networkFilter !== 'all' && token.network !== networkFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && token.type !== typeFilter) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'symbol':
          aValue = a.symbol.toLowerCase();
          bValue = b.symbol.toLowerCase();
          break;
        case 'price':
          aValue = a.price?.current || 0;
          bValue = b.price?.current || 0;
          break;
        case 'marketCap':
          aValue = a.price?.marketCap || 0;
          bValue = b.price?.marketCap || 0;
          break;
        case 'network':
          aValue = a.network;
          bValue = b.network;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'balance':
          // Balance sorting handled separately
          return 0;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tokens, searchQuery, networkFilter, typeFilter, sortField, sortDirection]);

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
          />
        </div>

        {/* Network Filter */}
        <div className="flex gap-2">
          {(['all', 'L1', 'L2'] as const).map((network) => (
            <button
              key={network}
              onClick={() => setNetworkFilter(network)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                networkFilter === network
                  ? 'bg-[#02abb8] text-white'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {network === 'all' ? 'All Networks' : network}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex gap-2">
          {(['all', 'global', 'local', 'collab'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                typeFilter === type
                  ? 'bg-[#02abb8] text-white'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Token
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
                onClick={() => handleSort('type')}
              >
                Type
                <SortIcon field="type" />
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => handleSort('price')}
              >
                Price
                <SortIcon field="price" />
              </th>
              <th
                className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => handleSort('marketCap')}
              >
                Market Cap
                <SortIcon field="marketCap" />
              </th>
              {isConnected && (
                <th
                  className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => handleSort('balance')}
                >
                  Your Balance
                  <SortIcon field="balance" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTokens.length === 0 ? (
              <tr>
                <td
                  colSpan={isConnected ? 6 : 5}
                  className="py-12 text-center text-zinc-500 dark:text-zinc-400"
                >
                  No tokens found matching your filters.
                </td>
              </tr>
            ) : (
              filteredAndSortedTokens.map((token) => (
                <TokenTableRow
                  key={token.id}
                  token={token}
                  isConnected={isConnected}
                  krexBalance={token.id === 'krex' ? krexBalance : undefined}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TokenTableRowProps {
  token: Token;
  isConnected: boolean;
  krexBalance?: number;
}

function TokenTableRow({ token, isConnected, krexBalance }: TokenTableRowProps) {
  const { address } = useAccount();

  // Get balance based on network
  const l2Balance = useTokenBalance(
    token.network === 'L2' && token.contractAddress ? token.contractAddress : null
  );
  const l1Balance = useKaspaTokenBalance(
    token.network === 'L1' ? token.symbol : null
  );

  // Determine which balance to show
  let displayBalance: string | number = '-';
  if (isConnected && address) {
    if (token.id === 'krex' && krexBalance !== undefined) {
      displayBalance = krexBalance > 0 ? formatLargeNumber(krexBalance) : '0';
    } else if (token.network === 'L2' && l2Balance.balanceNumber > 0) {
      displayBalance = formatLargeNumber(l2Balance.balanceNumber);
    } else if (token.network === 'L1' && l1Balance.balance > 0) {
      displayBalance = formatLargeNumber(l1Balance.balance);
    } else {
      displayBalance = '0';
    }
  }

  const logoUrl = token.logoCid
    ? getTokenImageUrl(token.logoCid)
    : token.logo || null;

  const networkBadgeColor =
    token.network === 'L1'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';

  const typeBadgeColor = {
    global: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    local: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    collab: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  }[token.type];

  const price = token.price?.current;
  const priceChange24h = token.price?.change24h;
  const marketCap = token.price?.marketCap;

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <td className="py-4 px-4">
        <Link href={`/tokens/${token.slug}`} className="flex items-center gap-3">
          <TokenLogo token={token} size={40} showName={true} showSymbol={true} />
        </Link>
      </td>
      <td className="py-4 px-4">
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${networkBadgeColor}`}
        >
          {token.network}
        </span>
      </td>
      <td className="py-4 px-4">
        <span
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize ${typeBadgeColor}`}
        >
          {token.type}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        {price !== undefined ? (
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
            {priceChange24h !== undefined && (
              <div
                className={`text-xs ${
                  priceChange24h >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {priceChange24h >= 0 ? '+' : ''}
                {priceChange24h.toFixed(2)}%
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        {marketCap !== undefined ? (
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            ${formatLargeNumber(marketCap)}
          </span>
        ) : (
          <span className="text-sm text-zinc-500 dark:text-zinc-400">-</span>
        )}
      </td>
      {isConnected && (
        <td className="py-4 px-4 text-right">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {typeof displayBalance === 'number' ? formatLargeNumber(displayBalance) : displayBalance}
          </span>
        </td>
      )}
    </tr>
  );
}
