'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchAllTokens } from '@/lib/krc20/api';
import type { KRC20Token } from '@/lib/krc20/types';

export default function TokensPage() {
  const [tokens, setTokens] = useState<KRC20Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function loadTokens() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch tokens from unified API (tries multiple sources)
        const allTokens = await fetchAllTokens(100);
        
        if (allTokens.length === 0) {
          setError('No KRC-20 tokens found. All API sources failed or returned no data. Please check your internet connection and try again.');
          return;
        }
        
        // Filter and validate tokens
        const validTokens = allTokens.filter(token => {
          // Must have symbol
          if (!token.symbol || token.symbol.length === 0 || token.symbol.length > 10) {
            return false;
          }
          // Decimals must be valid
          if (token.decimals === undefined || token.decimals < 0 || token.decimals > 18) {
            return false;
          }
          // Must have at least one of: address, name, or supply info
          if (!token.address && !token.name && !token.maxSupply && !token.totalSupply) {
            return false;
          }
          return true;
        });

        if (validTokens.length === 0) {
          setError('No valid KRC-20 tokens found after validation. All tokens were filtered out.');
          return;
        }

        // Sort tokens by holders (descending) or transaction count as fallback
        const sortedTokens = validTokens.sort((a, b) => {
          const aHolders = a.holders || 0;
          const bHolders = b.holders || 0;
          if (aHolders !== bHolders) {
            return bHolders - aHolders;
          }
          const aTx = a.transactionCount || 0;
          const bTx = b.transactionCount || 0;
          return bTx - aTx;
        });
        
        // Take top 50 tokens for display
        setTokens(sortedTokens.slice(0, 50));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tokens';
        setError(errorMessage);
        console.error('Error loading tokens:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTokens();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const formatNumber = (num: string | number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n) || n === 0) return '0';
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (num: string | number | undefined): string => {
    if (num === undefined || num === null) return 'N/A';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return 'N/A';
    if (n === 0) return '0';
    
    // Handle very large numbers that might be in string format
    if (n >= 1e18) {
      return `${(n / 1e18).toFixed(2)}E`;
    } else if (n >= 1e15) {
      return `${(n / 1e15).toFixed(2)}P`;
    } else if (n >= 1e12) {
      return `${(n / 1e12).toFixed(2)}T`;
    } else if (n >= 1e9) {
      return `${(n / 1e9).toFixed(2)}B`;
    } else if (n >= 1e6) {
      return `${(n / 1e6).toFixed(2)}M`;
    } else if (n >= 1e3) {
      return `${(n / 1e3).toFixed(2)}K`;
    }
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              KRC-20 Tokens
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              KRC-20 tokens on Kaspa blockchain - Data from multiple sources
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02abb8]"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-300 font-medium mb-2">{error}</p>
              <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                The app tried multiple API sources (kas.fyi, Kasplex Indexer, kaspa.com marketplace) but none returned data.
                Please check the browser console for more details.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#028a94] transition-colors text-sm font-medium"
                >
                  Retry
                </button>
                <a
                  href="https://docs.kas.fyi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors text-sm font-medium"
                >
                  View API Docs
                </a>
              </div>
            </div>
          )}

          {!isLoading && !error && tokens.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">No tokens found</p>
            </div>
          )}

          {!isLoading && !error && tokens.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {tokens.length} token{tokens.length !== 1 ? 's' : ''} (sorted by holders)
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Token
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Max Supply
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Minted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Holders
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Decimals
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {tokens.map((token, index) => (
                        <tr
                          key={`${token.symbol}-${token.address}-${index}`}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#02abb8] flex items-center justify-center text-white font-bold text-sm">
                                {token.symbol.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {token.symbol}
                                </div>
                                {token.name && token.name !== token.symbol && (
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {token.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                            {formatLargeNumber(token.maxSupply)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100 font-mono">
                            {formatLargeNumber(token.minted)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                            {formatNumber(token.holders)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                            {formatNumber(token.transactionCount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                            {token.decimals ?? 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

