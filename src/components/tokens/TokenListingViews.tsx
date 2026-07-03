'use client';

import Link from 'next/link';
import type { Token } from '@/lib/tokens/types';
import { KxListingCard, KxListingCardBody } from '@/components/kx/KxListingCard';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { TokenListingMeta } from '@/components/tokens/TokenListingMeta';
import { TokenListingTable, type TokenSortField, type TokenSortDirection } from '@/components/tokens/TokenListingTable';

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

export function TokenListingCardGrid({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {tokens.map((token) => (
        <KxListingCard key={token.id} href={`/tokens/${token.slug}`} accent="tokens">
          <KxListingCardBody comfortable>
            <div className="mb-3 flex items-start gap-3">
              <TokenLogo token={token} size={48} showName={false} showSymbol={false} />
              <div className="min-w-0 flex-1">
                <TokenTitle token={token} size="sm" />
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
              {token.shortDescription || token.description}
            </p>
            <div className="mb-2">
              <TokenListingMeta token={token} />
            </div>
            <TokenListingBadges token={token} />
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
          <TokenLogo token={token} size={40} showName={false} showSymbol={false} />
          <div className="flex-1 min-w-0">
            <TokenTitle token={token} size="sm" />
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
