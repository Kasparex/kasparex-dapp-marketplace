/**
 * Token Hero Section
 * Featured image and header for token landing page
 */

'use client';

import Image from 'next/image';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl, loadTokenLogoUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';

interface TokenHeroSectionProps {
  token: Token;
}

export function TokenHeroSection({ token }: TokenHeroSectionProps) {
  const featuredImageUrl = loadTokenFeaturedImageUrl(token);
  const logoUrl = loadTokenLogoUrl(token);

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
            <TokenLogo token={token} size={48} showName={true} showSymbol={true} className="flex-col" />
          </div>
        </div>
      )}
    </section>
  );
}
