'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TokenTitle } from '@/components/tokens/TokenTitle';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenListingBadges } from '@/components/tokens/TokenListingBadges';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import { TokenVerificationWizard } from '@/components/tokens/TokenVerificationWizard';
import { listingToToken } from '@/lib/tokens/listingRecord';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { getListingNetworkLabel, tokenNetworkToListingNetwork } from '@/lib/tokens/listingNetwork';

interface TokenListingArchiveProps {
  listings: PublishedTokenListing[];
  onEdit: (listing: PublishedTokenListing) => void;
  onDelete?: (id: string) => void;
  onVerify: (id: string, proof: { method: string; walletAddress: string; signature?: string }) => Promise<void> | void;
}

function statusPill(status: PublishedTokenListing['status']): { label: string; className: string } {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    case 'verification_pending':
      return {
        label: 'Pending verification',
        className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    case 'published':
      return { label: 'Published', className: 'bg-[#02abb8]/15 text-[#02abb8] border-[#02abb8]/30' };
    default:
      return {
        label: 'Draft',
        className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
      };
  }
}

export function TokenListingArchive({ listings, onEdit, onDelete, onVerify }: TokenListingArchiveProps) {
  const [verifyTarget, setVerifyTarget] = useState<PublishedTokenListing | null>(null);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.map((listing) => {
          const token = listingToToken(listing);
          const featuredImageUrl = loadTokenFeaturedImageUrl(token);
          const pill = statusPill(listing.status);
          const network = listing.listingNetwork ?? tokenNetworkToListingNetwork(listing.network, listing.contractAddress);
          const canVerify = listing.status !== 'verified';

          return (
            <KxListingCard key={listing.id} accent="tokens" className="flex h-full flex-col">
              <KxListingCardMedia aspectClass="aspect-[16/9]">
                {featuredImageUrl ? (
                  <Image src={featuredImageUrl} alt={`${listing.name} featured`} fill className="object-cover" unoptimized />
                ) : (
                  <KxListingFeaturedPlaceholder />
                )}
                <span
                  className={`absolute left-2 top-2 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill.className}`}
                >
                  {pill.label}
                </span>
              </KxListingCardMedia>
              <KxListingCardBody comfortable className="flex flex-1 flex-col">
                <div className="mb-3 flex items-start gap-3">
                  <TokenLogo token={token} size={48} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <TokenTitle token={token} size="sm" layout="besideLogo" />
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      {getListingNetworkLabel(network)}
                    </p>
                  </div>
                </div>
                <p className="mb-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {listing.shortDescription || listing.description}
                </p>
                <div className="mb-3">
                  <TokenListingBadges token={token} />
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Link href={`/tokens/${listing.slug}`} className="k-control-btn text-sm text-center">
                    View page
                  </Link>
                  <button type="button" onClick={() => onEdit(listing)} className="k-control-btn text-sm">
                    Edit
                  </button>
                  {canVerify ? (
                    <button
                      type="button"
                      onClick={() => setVerifyTarget(listing)}
                      className="k-control-btn text-sm !border-[#02abb8]/40 !text-[#02abb8] col-span-1"
                    >
                      Verify
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(listing.id)}
                      className={`k-control-btn text-sm text-red-600 dark:text-red-400 ${canVerify ? '' : 'col-span-2'}`}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </KxListingCardBody>
            </KxListingCard>
          );
        })}
      </div>

      {verifyTarget ? (
        <TokenVerificationWizard
          listing={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onVerified={async (proof) => {
            await onVerify(verifyTarget.id, proof);
            setVerifyTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
