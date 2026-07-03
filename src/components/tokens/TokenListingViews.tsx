'use client';

import Image from 'next/image';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import Link from 'next/link';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { TokenListingMeta } from '@/components/tokens/TokenListingMeta';
import { TokenNetworkChips } from '@/components/tokens/TokenNetworkChips';
import { TokenListingTable, type TokenSortField, type TokenSortDirection } from '@/components/tokens/TokenListingTable';
import { Tooltip } from '@/components/ui/Tooltip';

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-12 text-center">
      <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-2">No tokens found</p>
      <p className="text-sm text-zinc-500 max-w-md mx-auto">
        Try another filter or reset search to browse more ecosystem tokens.
      </p>
    </div>
  );
}

function TokenFeaturedMedia({ token }: { token: Token }) {
  const featuredImageUrl = loadTokenFeaturedImageUrl(token);

  if (featuredImageUrl) {
    return (
      <Image
        src={featuredImageUrl}
        alt={`${token.name} featured`}
        fill
        className="object-cover"
        unoptimized
      />
    );
  }

  return <KxListingFeaturedPlaceholder />;
}

export function TokenListingCardGrid({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {tokens.map((token) => (
        <KxListingCard key={token.id} href={`/tokens/${token.slug}`} accent="tokens" className="flex h-full flex-col">
          <KxListingCardMedia aspectClass="aspect-[16/9]">
            <TokenFeaturedMedia token={token} />
            {token.listing?.featured ? (
              <Tooltip content="Premium featured listing">
                <span className="absolute top-2 right-2 rounded-md bg-zinc-900/75 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                  Featured
                </span>
              </Tooltip>
            ) : null}
          </KxListingCardMedia>
          <KxListingCardBody comfortable className="flex flex-1 flex-col">
            <div className="mb-3 flex items-start gap-4">
              <TokenLogo token={token} size={56} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
              <TokenTitle token={token} size="sm" layout="besideLogo" className="flex-1 min-w-0" />
            </div>
            <p className="mb-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
              {token.shortDescription || token.description}
            </p>
            <div className="mb-2">
              <TokenListingMeta token={token} />
            </div>
            <div className="mb-2">
              <TokenNetworkChips token={token} />
            </div>
            <div className="mt-auto pt-2">
              <TokenListingBadges token={token} />
            </div>
          </KxListingCardBody>
        </KxListingCard>
      ))}
    </div>
  );
}

export function TokenListingCompact({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {tokens.map((token) => (
        <Link
          key={token.id}
          href={`/tokens/${token.slug}`}
          className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
        >
          <TokenLogo token={token} size={48} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <TokenTitle token={token} size="sm" layout="besideLogo" />
            <TokenListingMeta token={token} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function TokenListingTableView({
  tokens,
  displayTokens,
  sortField,
  sortDirection,
  onSort,
}: {
  tokens: Token[];
  displayTokens: Token[];
  sortField?: TokenSortField;
  sortDirection?: TokenSortDirection;
  onSort?: (field: TokenSortField) => void;
}) {
  return (
    <TokenListingTable
      tokens={tokens}
      displayTokens={displayTokens}
      sortField={sortField}
      sortDirection={sortDirection}
      onSort={onSort}
    />
  );
}
