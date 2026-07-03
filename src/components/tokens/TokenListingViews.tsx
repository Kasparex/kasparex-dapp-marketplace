'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { TokenVoteControls } from '@/components/tokens/TokenVoteControls';
import { TokenListingTable, type TokenSortField, type TokenSortDirection } from '@/components/tokens/TokenListingTable';
import { getTokenActivityScore } from '@/lib/tokens/listing';

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

function NetworkChip({ network }: { network: Token['network'] }) {
  return <KxListingCategoryChip>{network}</KxListingCategoryChip>;
}

export function TokenListingCardGrid({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {tokens.map((token) => (
        <KxListingCard key={token.id} href={`/tokens/${token.slug}`} accent="tokens">
          <KxListingCardMedia aspectClass="aspect-[16/9]">
            <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
              <TokenLogo token={token} size={64} showName={false} showSymbol={false} />
            </div>
            {token.listing?.featured ? (
              <span className="absolute top-2 right-2 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                Featured
              </span>
            ) : null}
          </KxListingCardMedia>
          <KxListingCardBody comfortable>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{token.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{token.symbol}</p>
              </div>
              <TokenVoteControls
                tokenId={token.id}
                baseCommunityScore={token.listing?.communityScore ?? 0}
                compact
              />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
              {token.shortDescription || token.description}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <NetworkChip network={token.network} />
              <KxListingCategoryChip>{token.type}</KxListingCategoryChip>
              {getTokenActivityScore(token) > 0 ? (
                <span className="text-[10px] font-semibold text-zinc-500">
                  Activity {getTokenActivityScore(token)}
                </span>
              ) : null}
            </div>
            <TokenListingBadges token={token} compact showUtilityChips={false} />
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
          <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <TokenLogo token={token} size={40} showName={false} showSymbol={false} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{token.name}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="font-bold">{token.symbol}</span>
              <span aria-hidden>•</span>
              <span>{token.network}</span>
            </div>
            <TokenListingBadges token={token} compact showUtilityChips={false} />
          </div>
          <TokenVoteControls
            tokenId={token.id}
            baseCommunityScore={token.listing?.communityScore ?? 0}
            compact
          />
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
