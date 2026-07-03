'use client';

import Image from 'next/image';
import type { Token } from '@/lib/tokens/types';
import { loadTokenLogoUrl } from '@/lib/tokens/metadata';

export interface TokenLogoProps {
  token: Token;
  size?: 24 | 32 | 40 | 48 | 56 | 64 | 80;
  showName?: boolean;
  showSymbol?: boolean;
  className?: string;
  nameClassName?: string;
  symbolClassName?: string;
  /** circle (default) or rounded-xl for listing cards (dApp-style). */
  shape?: 'circle' | 'rounded';
}

/**
 * Reusable component for displaying token logos next to names
 * Follows KaspaCom Swap design patterns
 */
export function TokenLogo({
  token,
  size = 32,
  showName = false,
  showSymbol = false,
  className = '',
  nameClassName = '',
  symbolClassName = '',
  shape = 'circle',
}: TokenLogoProps) {
  const logoUrl = loadTokenLogoUrl(token);
  const shapeClass = shape === 'rounded' ? 'rounded-xl' : 'rounded-full';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo */}
      {logoUrl ? (
        <div
          className={`relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 ${shapeClass}`}
          style={{ width: size, height: size }}
        >
          <Image
            src={logoUrl}
            alt={`${token.name} logo`}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                    <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      ${token.symbol.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                `;
              }
            }}
          />
        </div>
      ) : (
        <div
          className={`bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 ${shapeClass}`}
          style={{ width: size, height: size }}
        >
          <span
            className="font-semibold text-zinc-600 dark:text-zinc-400"
            style={{ fontSize: `${size * 0.4}px` }}
          >
            {token.symbol.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {(showName || showSymbol) && (
        <div className="flex flex-col min-w-0">
          {showSymbol && (
            <span
              className={`text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate ${symbolClassName}`}
            >
              {token.symbol}
            </span>
          )}
          {showName && (
            <span
              className={`text-xs text-zinc-500 dark:text-zinc-400 truncate ${nameClassName}`}
            >
              {token.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version showing only logo and symbol (for small spaces)
 */
export function TokenLogoCompact({
  token,
  size = 24,
  className = '',
}: {
  token: Token;
  size?: 24 | 32 | 40 | 48 | 56 | 64 | 80;
  className?: string;
}) {
  return (
    <TokenLogo
      token={token}
      size={size}
      showSymbol={true}
      showName={false}
      className={className}
    />
  );
}

/**
 * Full version showing logo, name, and symbol
 */
export function TokenLogoFull({
  token,
  size = 40,
  className = '',
}: {
  token: Token;
  size?: 24 | 32 | 40 | 48 | 56 | 64 | 80;
  className?: string;
}) {
  return (
    <TokenLogo
      token={token}
      size={size}
      showName={true}
      showSymbol={true}
      className={className}
    />
  );
}
