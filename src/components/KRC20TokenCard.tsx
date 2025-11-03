/**
 * KRC-20 Token Card Component
 * 
 * Displays token information in a card format
 */

'use client';

import Image from 'next/image';
import type { KRC20Token } from '@/lib/krc20/types';

interface KRC20TokenCardProps {
  token: KRC20Token;
  onClick?: () => void;
  showBalance?: boolean;
  balance?: string;
}

export function KRC20TokenCard({ 
  token, 
  onClick,
  showBalance = false,
  balance 
}: KRC20TokenCardProps) {
  const logoUrl = token.logo || `/img/tokens/${token.symbol.toLowerCase()}.png`;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 ${
        onClick ? 'cursor-pointer hover:border-[#02abb8] hover:shadow-md transition-all' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
          {token.logo ? (
            <Image
              src={logoUrl}
              alt={token.symbol}
              fill
              className="object-contain"
              onError={(e) => {
                // Fallback to placeholder if image fails
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {token.symbol.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {token.symbol}
            </h3>
            {token.marketData?.price && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400 ml-2">
                ${token.marketData.price.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate mb-2">
            {token.name}
          </p>
          
          {showBalance && balance && (
            <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Balance: </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {balance} {token.symbol}
                </span>
              </div>
            </div>
          )}

          {token.marketData && (
            <div className="flex gap-4 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {token.marketData.marketCap && (
                <span>MC: ${(token.marketData.marketCap / 1e6).toFixed(2)}M</span>
              )}
              {token.marketData.holders && (
                <span>Holders: {token.marketData.holders.toLocaleString()}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

