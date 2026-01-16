/**
 * Token Hero Section
 * Featured image and header for token landing page
 */

'use client';

import Image from 'next/image';
import type { Token } from '@/lib/tokens/types';
import { getTokenImageUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';

interface TokenHeroSectionProps {
  token: Token;
}

export function TokenHeroSection({ token }: TokenHeroSectionProps) {
  const featuredImageUrl = token.featuredImageCid
    ? getTokenImageUrl(token.featuredImageCid)
    : token.featuredImage || null;

  const logoUrl = token.logoCid
    ? getTokenImageUrl(token.logoCid)
    : token.logo || null;

  return (
    <section className="relative w-full mb-8">
      {/* Featured Image */}
      {featuredImageUrl ? (
        <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={featuredImageUrl}
            alt={token.name}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      ) : (
        <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-lg overflow-hidden bg-gradient-to-br from-[#02abb8]/20 to-zinc-200 dark:from-[#02abb8]/10 dark:to-zinc-800 flex items-center justify-center">
          <div className="text-center space-y-4">
            {logoUrl ? (
              <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden bg-white dark:bg-zinc-900">
                <Image
                  src={logoUrl}
                  alt={token.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-24 h-24 mx-auto rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                  {token.symbol.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <TokenLogo token={token} size={48} showName={true} showSymbol={true} className="flex-col" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
