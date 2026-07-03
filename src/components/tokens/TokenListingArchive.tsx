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
import { TokenVerificationWizard, type TokenVerificationMode } from '@/components/tokens/TokenVerificationWizard';
import { listingToToken } from '@/lib/tokens/listingRecord';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { getListingNetworkLabel, tokenNetworkToListingNetwork } from '@/lib/tokens/listingNetwork';

interface TokenListingArchiveProps {
  listings: PublishedTokenListing[];
  onEdit: (listing: PublishedTokenListing) => void;
  onDelete?: (id: string) => void;
  onVerifyDeployer: (id: string, proof: { method: string; walletAddress: string; signature?: string }) => Promise<void> | void;
  onAssignWallet: (id: string, proof: { method: string; walletAddress: string; signature?: string }) => Promise<void> | void;
}

function paymentPill(status: PublishedTokenListing['status']): { label: string; className: string } {
  switch (status) {
    case 'verified':
    case 'published':
      return { label: 'Published', className: 'bg-[#02abb8]/15 text-[#02abb8] border-[#02abb8]/30' };
    case 'verification_pending':
      return { label: 'Payment pending', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    default:
      return { label: 'Draft', className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30' };
  }
}

function ownershipLabel(listing: PublishedTokenListing): string {
  if (listing.ownership === 'deployer_verified') return 'Developer UaaS (verified)';
  if (listing.ownership === 'wallet_assigned') return 'Wallet assigned';
  if (listing.assetKind === 'real') return 'Real token (unverified)';
  return 'Community collab';
}

export function TokenListingArchive({
  listings,
  onEdit,
  onDelete,
  onVerifyDeployer,
  onAssignWallet,
}: TokenListingArchiveProps) {
  const [wizardTarget, setWizardTarget] = useState<PublishedTokenListing | null>(null);
  const [wizardMode, setWizardMode] = useState<TokenVerificationMode>('deployer');

  const openWizard = (listing: PublishedTokenListing, mode: TokenVerificationMode) => {
    setWizardTarget(listing);
    setWizardMode(mode);
  };

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
          const pill = paymentPill(listing.status);
          const network = listing.listingNetwork ?? tokenNetworkToListingNetwork(listing.network, listing.contractAddress);
          const canVerifyDeployer = listing.ownership !== 'deployer_verified';
          const isReal = listing.assetKind === 'real';

          return (
            <KxListingCard key={listing.id} accent="tokens" className="flex h-full flex-col">
              <KxListingCardMedia aspectClass="aspect-[16/9]">
                {featuredImageUrl ? (
                  <Image src={featuredImageUrl} alt={`${listing.name} featured`} fill className="object-cover" unoptimized />
                ) : (
                  <KxListingFeaturedPlaceholder />
                )}
                <span className={`absolute left-2 top-2 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pill.className}`}>
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
                <p className="mb-2 text-xs font-semibold text-[#02abb8]">{ownershipLabel(listing)}</p>
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
                  {canVerifyDeployer && isReal ? (
                    <button
                      type="button"
                      onClick={() => openWizard(listing, 'deployer')}
                      className="k-control-btn col-span-2 text-sm !border-[#02abb8]/40 !text-[#02abb8]"
                    >
                      Verify with Deployer Wallet
                    </button>
                  ) : null}
                  {listing.ownership !== 'wallet_assigned' && listing.ownership !== 'deployer_verified' ? (
                    <button
                      type="button"
                      onClick={() => openWizard(listing, 'assign')}
                      className="k-control-btn col-span-2 text-sm"
                    >
                      Assign Wallet Address
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(listing.id)}
                      className="k-control-btn col-span-2 text-sm text-red-600 dark:text-red-400"
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

      {wizardTarget ? (
        <TokenVerificationWizard
          listing={wizardTarget}
          mode={wizardMode}
          onClose={() => setWizardTarget(null)}
          onComplete={async (proof) => {
            if (wizardMode === 'deployer') {
              await onVerifyDeployer(wizardTarget.id, proof);
            } else {
              await onAssignWallet(wizardTarget.id, proof);
            }
            setWizardTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}
