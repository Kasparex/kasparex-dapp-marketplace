/**
 * Token Hero Section
 * Featured image and header for token landing page
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl, loadTokenLogoUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';

interface TokenHeroSectionProps {
  token: Token;
}

export function TokenHeroSection({ token }: TokenHeroSectionProps) {
  const featuredImageUrl = loadTokenFeaturedImageUrl(token);

  return (
    <section className="relative w-full mb-8 group">
      {/* Featured Image */}
      {featuredImageUrl ? (
        <div className="relative w-full h-64 sm:h-80 lg:h-[450px] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-white/10 shadow-2xl">
          <Image
            src={featuredImageUrl}
            alt={token.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            unoptimized
          />
        </div>
      ) : (
        <div className="relative w-full h-64 sm:h-80 lg:h-[450px] rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-700 to-zinc-900 dark:from-violet-950 dark:via-indigo-950 dark:to-zinc-950 flex items-center justify-center border border-white/10 shadow-2xl">
          <div className="text-center space-y-4 relative z-20">
            <TokenLogo token={token} size={80} showName={false} showSymbol={false} />
            <h2 className="text-4xl font-black text-white italic tracking-tighter">
              {token.name}
            </h2>
          </div>
          {/* Animated background elements for placeholder */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </div>
        </div>
      )}

      {/* Hero Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 z-20">
        <div className="flex items-center gap-4 bg-white/10 dark:bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl">
          <TokenLogo token={token} size={64} showName={false} showSymbol={false} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
              {token.name}
            </h1>
            <p className="text-white/80 font-bold tracking-widest text-xs uppercase italic">
              {token.symbol} • {token.network} {token.type}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {(token.network === 'L2' || token.id === 'krex') && (
            <Link
              href={`/defi/swaps?outputCurrency=${token.contractAddress || ''}`}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-black text-sm shadow-xl shadow-violet-950/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              SWAP NOW
            </Link>
          )}
          {token.links?.find(l => l.type === 'explorer') && (
            <a
              href={token.links.find(l => l.type === 'explorer')?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
            >
              EXPLORER
            </a>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 rounded-3xl" />
    </section>
  );
}
