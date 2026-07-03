/**
 * Price Section
 * Displays token price information
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

interface PriceSectionProps {
  token: Token;
}

export function PriceSection({ token }: PriceSectionProps) {
  const price = token.price;

  if (!price) {
    return null;
  }

  return (
    <section id="price" className="space-y-6">
      <DAppSectionHeader title="Price" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Price */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Current Price</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ${price.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
          </div>
        </div>

        {/* 24h Change */}
        {price.change24h !== undefined && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">24h Change</div>
            <div
              className={`text-xl font-semibold ${
                price.change24h >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {price.change24h >= 0 ? '+' : ''}
              {price.change24h.toFixed(2)}%
            </div>
          </div>
        )}

        {/* Market Cap */}
        {price.marketCap !== undefined && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Market Cap</div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              ${price.marketCap.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        )}

        {/* 24h Volume */}
        {price.volume24h !== undefined && (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">24h Volume</div>
            <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              ${price.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        )}
      </div>

      {price.lastUpdated && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Last updated: {new Date(price.lastUpdated).toLocaleString()}
        </div>
      )}
    </section>
  );
}
