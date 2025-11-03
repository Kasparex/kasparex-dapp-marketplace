/**
 * Token Selector Component
 * 
 * Dropdown/selector for choosing KRC-20 tokens
 */

'use client';

import { useState, useMemo } from 'react';
import { useKRC20Tokens } from '@/hooks/useKRC20Tokens';
import type { KRC20Token } from '@/lib/krc20/types';
import { KRC20TokenCard } from './KRC20TokenCard';

interface TokenSelectorProps {
  selectedToken?: KRC20Token | null;
  onSelectToken: (token: KRC20Token | null) => void;
  placeholder?: string;
  showBalance?: boolean;
  filterBySymbols?: string[];
}

export function TokenSelector({
  selectedToken,
  onSelectToken,
  placeholder = 'Select a token',
  showBalance = false,
  filterBySymbols,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: tokens, isLoading, isError } = useKRC20Tokens();

  // Filter tokens
  const filteredTokens = useMemo(() => {
    if (!tokens) return [];

    let filtered = tokens;

    // Filter by symbols if provided
    if (filterBySymbols && filterBySymbols.length > 0) {
      filtered = filtered.filter(token =>
        filterBySymbols.some(symbol =>
          token.symbol.toUpperCase() === symbol.toUpperCase()
        )
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(token =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [tokens, filterBySymbols, searchQuery]);

  const handleSelect = (token: KRC20Token) => {
    onSelectToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-left flex items-center justify-between hover:border-[#02abb8] transition-colors"
      >
        {selectedToken ? (
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {selectedToken.symbol}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {selectedToken.name}
            </span>
          </div>
        ) : (
          <span className="text-zinc-500 dark:text-zinc-400">{placeholder}</span>
        )}
        <svg
          className={`w-5 h-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-h-96 overflow-hidden">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
              />
            </div>

            <div className="overflow-y-auto max-h-80">
              {isLoading ? (
                <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                  Loading tokens...
                </div>
              ) : isError ? (
                <div className="p-4 text-center text-red-500 dark:text-red-400">
                  Error loading tokens
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
                  No tokens found
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredTokens.map((token) => (
                    <div
                      key={token.address}
                      onClick={() => handleSelect(token)}
                      className="cursor-pointer"
                    >
                      <KRC20TokenCard
                        token={token}
                        showBalance={showBalance}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

