'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchTopKasplexTokens, convertKasplexTokenToKRC20, type KasplexToken } from '@/lib/krc20/kasplex-indexer';
import type { KRC20Token } from '@/lib/krc20/types';

export default function TokensPage() {
  const [tokens, setTokens] = useState<KRC20Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTokens() {
      try {
        setIsLoading(true);
        setError(null);
        const kasplexTokens = await fetchTopKasplexTokens(20);
        
        if (kasplexTokens.length === 0) {
          setError('No KRC-20 tokens found. The Kasplex Indexer API may be unavailable or the endpoint may have changed.');
          return;
        }
        
        const convertedTokens = kasplexTokens.map(token => convertKasplexTokenToKRC20(token));
        setTokens(convertedTokens);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load tokens';
        setError(errorMessage);
        console.error('Error loading tokens:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTokens();
  }, []);

  const formatNumber = (num: string | number | undefined): string => {
    if (!num) return 'N/A';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return 'N/A';
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatLargeNumber = (num: string | number | undefined): string => {
    if (!num) return 'N/A';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return 'N/A';
    
    if (n >= 1e9) {
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
              Top 20 KRC-20 tokens on Kaspa blockchain
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
              <p className="text-sm text-red-700 dark:text-red-400">
                Please check the browser console for more details. If the issue persists, the Kasplex Indexer API endpoint may have changed. 
                Refer to the{' '}
                <a 
                  href="https://docs-kasplex.gitbook.io/krc20/tools-and-reference/kasplex-indexer-api/krc-20" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-red-900 dark:hover:text-red-300"
                >
                  Kasplex Indexer API documentation
                </a>
                {' '}for the correct endpoint.
              </p>
            </div>
          )}

          {!isLoading && !error && tokens.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-500 dark:text-zinc-400">No tokens found</p>
            </div>
          )}

          {!isLoading && !error && tokens.length > 0 && (
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
                        key={token.address}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#02abb8] flex items-center justify-center text-white font-bold text-sm">
                              {token.symbol.charAt(0)}
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
                          {token.decimals}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

