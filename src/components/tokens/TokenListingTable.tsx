/**
 * Token Listing Table Component
 * Filterable and sortable table with wallet balance integration
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import type { Token, TokenNetwork, TokenType } from '@/lib/tokens/types';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useKaspaTokenBalance } from '@/hooks/useKaspaTokenBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { TokenLogo } from './TokenLogo';
import { formatLargeNumber } from '@/lib/rewards/calculator';
import { TokenListingMeta } from './TokenListingMeta';
import { Tooltip } from '@/components/ui/Tooltip';

export type TokenSortField = 'name' | 'symbol' | 'price' | 'marketCap' | 'balance' | 'network' | 'type';
export type TokenSortDirection = 'asc' | 'desc';

interface TokenListingTableProps {
  tokens: Token[];
  displayTokens?: Token[];
  sortField?: TokenSortField;
  sortDirection?: TokenSortDirection;
  onSort?: (field: TokenSortField) => void;
}

export function TokenListingTable({
  tokens,
  displayTokens: controlledDisplayTokens,
  sortField: controlledSortField,
  sortDirection: controlledSortDirection,
  onSort: controlledOnSort,
}: TokenListingTableProps) {
  const { address, isConnected } = useAccount();
  const { balance: krexBalance } = useKREXBalance();

  const isControlled = controlledDisplayTokens !== undefined;

  const [searchQuery, setSearchQuery] = useState('');
  const [networkFilter, setNetworkFilter] = useState<TokenNetwork | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TokenType | 'all'>('all');
  const [sortField, setSortField] = useState<TokenSortField>('name');
  const [sortDirection, setSortDirection] = useState<TokenSortDirection>('asc');

  const effectiveSortField = isControlled ? controlledSortField ?? 'name' : sortField;
  const effectiveSortDirection = isControlled ? controlledSortDirection ?? 'asc' : sortDirection;
  const handleSort = isControlled ? (controlledOnSort ?? (() => {})) : (field: TokenSortField) => {
    if (sortField === field) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('asc'); }
  };

  const internalFilteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter((token) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          token.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (networkFilter !== 'all' && token.network !== networkFilter) return false;
      if (typeFilter !== 'all' && token.type !== typeFilter) return false;
      return true;
    });

    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      switch (sortField) {
        case 'name': aValue = a.name.toLowerCase(); bValue = b.name.toLowerCase(); break;
        case 'symbol': aValue = a.symbol.toLowerCase(); bValue = b.symbol.toLowerCase(); break;
        case 'price': aValue = a.price?.current || 0; bValue = b.price?.current || 0; break;
        case 'marketCap': aValue = a.price?.marketCap || 0; bValue = b.price?.marketCap || 0; break;
        case 'network': aValue = a.network; bValue = b.network; break;
        case 'type': aValue = a.type; bValue = b.type; break;
        default: return 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tokens, searchQuery, networkFilter, typeFilter, sortField, sortDirection]);

  const filteredAndSortedTokens = isControlled ? (controlledDisplayTokens ?? []) : internalFilteredAndSortedTokens;

  const SortIcon = ({ field }: { field: TokenSortField }) => {
    if (effectiveSortField !== field) return null;
    return (
      <span className="ml-1 text-zinc-400">
        {effectiveSortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {!isControlled && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 overflow-visible">
            <div className="k-search-container h-10">
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`k-search-input h-10 w-full ${searchQuery.length > 0 ? 'is-typing' : ''}`.trim()}
              />
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Token
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Details
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
                  colSpan={isConnected ? 5 : 4}
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

  const l2Balance = useTokenBalance(
    token.network === 'L2' && token.contractAddress ? token.contractAddress : null
  );
  const l1Balance = useKaspaTokenBalance(
    token.network === 'L1' ? token.symbol : null
  );

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
        <TokenListingMeta token={token} />
      </td>
      <td className="py-4 px-4 text-right">
        {price !== undefined ? (
          <div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
            {priceChange24h !== undefined ? (
              <Tooltip content="24 hour price change">
                <div
                  className={`text-xs cursor-help ${
                    priceChange24h >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {priceChange24h >= 0 ? '+' : ''}
                  {priceChange24h.toFixed(2)}%
                </div>
              </Tooltip>
            ) : null}
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
