'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AdSlider } from '@/components/ads/AdSlider';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import { TokenLogo } from './TokenLogo';
import { TokenTitle } from './TokenTitle';
import { TokenListingBadges } from './TokenListingBadges';
import { TokenNetworkChips } from './TokenNetworkChips';

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
          <div className="mb-4 flex items-start gap-4">
            <TokenLogo token={token} size={64} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <TokenTitle token={token} size="lg" layout="besideLogo" />
            </div>
          </div>
          <p className="max-w-2xl kx-body-sm">{short}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <TokenListingBadges token={token} />
            <TokenNetworkChips token={token} className="justify-end shrink-0" />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {(token.network === 'L2' || token.id === 'krex') && (
              <Link
                href={`/defi/swaps?outputCurrency=${token.contractAddress || ''}`}
                className="k-cta-primary text-sm"
              >
                Swap
              </Link>
            )}
            {token.links?.find((l) => l.type === 'explorer') && (
              <a
                href={token.links.find((l) => l.type === 'explorer')?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="k-cta-secondary text-sm"
              >
                Explorer
              </a>
            )}
          </div>
        </div>

        <div className="flex w-full max-w-[280px] shrink-0 flex-col items-stretch gap-4 lg:items-end">
          {featuredImageUrl ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image src={featuredImageUrl} alt={token.name} fill className="object-cover" priority unoptimized />
            </div>
          ) : (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <KxListingFeaturedPlaceholder iconClassName="h-14 w-14" />
            </div>
          )}
          <div
            id="ad-slot-token-detail-halo"
            className="relative flex min-h-[160px] w-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/40"
          >
            <AdSlider slotId="HALO_TOKENS_RIGHT" />
          </div>
        </div>
      </div>
    </section>
  );
}
