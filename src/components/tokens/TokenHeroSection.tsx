/**
 * Protocol-family style hero (halo gradient, badge, title) with optional featured art.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';

interface TokenHeroSectionProps {
  token: Token;
}

export function TokenHeroSection({ token }: TokenHeroSectionProps) {
  const featuredImageUrl = loadTokenFeaturedImageUrl(token);

  const short =
    token.shortDescription?.trim() ||
    (token.description.length > 220 ? `${token.description.slice(0, 217)}…` : token.description);

  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-100 via-cyan-50/40 to-zinc-100 px-6 py-10 sm:px-8 dark:border-zinc-800/50 dark:from-zinc-950 dark:via-cyan-950/20 dark:to-zinc-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-0 h-[70%] w-[55%] rounded-full bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.14),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-800 dark:text-cyan-200">
            {token.symbol} · {token.network} · {token.type}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-4xl">{token.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">{short}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {(token.network === 'L2' || token.id === 'krex') && (
              <Link
                href={`/defi/swaps?outputCurrency=${token.contractAddress || ''}`}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:bg-cyan-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Swap
              </Link>
            )}
            {token.links?.find((l) => l.type === 'explorer') && (
              <a
                href={token.links.find((l) => l.type === 'explorer')?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white/80 px-5 py-2.5 text-sm font-bold text-zinc-800 backdrop-blur transition hover:border-cyan-500/40 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-100"
              >
                Explorer
              </a>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-sm shrink-0 flex-col items-stretch gap-4 lg:items-end">
          {featuredImageUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
              <Image src={featuredImageUrl} alt={token.name} fill className="object-cover" priority unoptimized />
            </div>
          ) : (
            <div className="flex h-40 w-full max-w-[200px] items-center justify-center self-end rounded-2xl border border-zinc-200 bg-white/60 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <TokenLogo token={token} size={96} showName={false} showSymbol={false} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
