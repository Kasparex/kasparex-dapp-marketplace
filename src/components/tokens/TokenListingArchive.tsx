'use client';

import Link from 'next/link';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { listingToToken } from '@/lib/tokens/listingRecord';

interface TokenListingArchiveProps {
  listings: PublishedTokenListing[];
  onEdit: (listing: PublishedTokenListing) => void;
  onDelete?: (id: string) => void;
}

function statusLabel(status: PublishedTokenListing['status']): string {
  switch (status) {
    case 'verified':
      return 'Verified';
    case 'verification_pending':
      return 'Pending verification';
    case 'published':
      return 'Published';
    default:
      return 'Draft';
  }
}

export function TokenListingArchive({ listings, onEdit, onDelete }: TokenListingArchiveProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-10 text-center">
        <DAppSectionHeader title="Your token listings" className="mb-3 justify-center" />
        <p className="kx-body-sm max-w-md mx-auto mb-6">
          Published token pages appear here after you pay and verify on Kaspa L1.
        </p>
        <Link href="/tokens" className="k-cta-secondary text-sm">
          Browse ecosystem tokens
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DAppSectionHeader title="Your token listings" />
      <ul className="space-y-3">
        {listings.map((listing) => {
          const token = listingToToken(listing);
          return (
            <li
              key={listing.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <TokenTitle token={token} size="sm" />
                    <TokenListingBadges token={token} />
                  </div>
                  <p className="kx-body-sm line-clamp-2">{listing.shortDescription || listing.description}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{statusLabel(listing.status)}</span>
                    <span>{listing.network}</span>
                    {listing.contractAddress ? (
                      <span className="truncate max-w-[12rem]">{listing.contractAddress}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link href={`/tokens/${listing.slug}`} className="k-control-btn text-sm">
                    View page
                  </Link>
                  <button type="button" onClick={() => onEdit(listing)} className="k-control-btn text-sm">
                    Edit
                  </button>
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(listing.id)}
                      className="k-control-btn text-sm text-red-600 dark:text-red-400"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
