/**
 * Tokenomics Section
 * Displays token distribution and allocation
 */

'use client';

import type { Token } from '@/lib/tokens/types';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface TokenomicsSectionProps {
  token: Token;
}

export function TokenomicsSection({ token }: TokenomicsSectionProps) {
  const allocations = token.allocations || [];

  if (allocations.length === 0 && !token.totalSupply) {
    return null;
  }

  return (
    <section id="tokenomics" className="scroll-mt-28 space-y-6 border-b border-zinc-200 py-10 dark:border-zinc-800">
      <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Tokenomics</h2>

      {/* Supply Info */}
      {(token.totalSupply || token.circulatingSupply) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {token.totalSupply && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Supply</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(token.totalSupply)} {token.symbol}
              </div>
            </div>
          )}
          {token.circulatingSupply && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Circulating Supply</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(token.circulatingSupply)} {token.symbol}
              </div>
            </div>
          )}
          {token.maxSupply && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Max Supply</div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatLargeNumber(token.maxSupply)} {token.symbol}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Allocation Breakdown */}
      {allocations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Distribution
          </h3>
          <div className="space-y-3">
            {allocations.map((allocation, index) => {
              const amount = allocation.amount
                ? `${formatLargeNumber(allocation.amount)} ${token.symbol}`
                : null;

              return (
                <div
                  key={index}
                  className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {allocation.category}
                      </div>
                      {allocation.description && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {allocation.description}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {allocation.percentage}%
                      </div>
                      {amount && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{amount}</div>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#02abb8] h-2 rounded-full transition-all"
                      style={{ width: `${allocation.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
