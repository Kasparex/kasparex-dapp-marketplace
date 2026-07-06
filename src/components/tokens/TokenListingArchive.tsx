'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import { TokenLogo } from '@/components/tokens/TokenLogo';
import { TokenListingCardContent } from '@/components/tokens/TokenListingCardContent';
import { TokenVerificationWizard, type TokenVerificationMode } from '@/components/tokens/TokenVerificationWizard';
import { listingToToken } from '@/lib/tokens/listingRecord';
import { getProgrammableExplorerUrl } from '@/lib/tokens/networks';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import type { ClaimableSeed } from '@/lib/tokens/seedClaims';

interface TokenListingArchiveProps {
  listings: PublishedTokenListing[];
  onEdit: (listing: PublishedTokenListing) => void;
  onDelete?: (id: string) => void;
  onVerifyDeployer: (id: string, proof: { method: string; walletAddress: string; signature?: string }) => Promise<void> | void;
  onAssignWallet: (id: string, proof: { method: string; walletAddress: string; signature?: string }) => Promise<void> | void;
  onUnassignWallet?: (id: string) => Promise<void> | void;
  claimableSeeds?: ClaimableSeed[];
  onClaimSeed?: (seed: ClaimableSeed) => Promise<void> | void;
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

function ClaimableSeedsPanel({
  seeds,
  onClaimSeed,
}: {
  seeds: ClaimableSeed[];
  onClaimSeed: (seed: ClaimableSeed) => Promise<void> | void;
}) {
  const [claiming, setClaiming] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-[#02abb8]/30 bg-[#02abb8]/5 p-5">
      <DAppSectionHeader title="Claimable ecosystem pages" className="mb-2" />
      <p className="kx-body-sm mb-4">
        Your connected wallet is the registered deployer for these ecosystem token pages. Claim them to manage and edit
        them from your dashboard.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {seeds.map((seed) => (
          <div
            key={seed.slug}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <TokenLogo token={seed.token} size={40} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {seed.token.name}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {seed.token.symbol}
                {seed.coin ? ' (coin)' : ''}
              </p>
            </div>
            <button
              type="button"
              disabled={claiming === seed.slug}
              onClick={async () => {
                setClaiming(seed.slug);
                try {
                  await onClaimSeed(seed);
                } finally {
                  setClaiming(null);
                }
              }}
              className="k-control-btn shrink-0 text-sm !border-[#02abb8]/40 !text-[#02abb8] disabled:opacity-50"
            >
              {claiming === seed.slug ? 'Claiming…' : 'Claim'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TokenListingArchive({
  listings,
  onEdit,
  onDelete,
  onVerifyDeployer,
  onAssignWallet,
  onUnassignWallet,
  claimableSeeds = [],
  onClaimSeed,
}: TokenListingArchiveProps) {
  const [wizardTarget, setWizardTarget] = useState<PublishedTokenListing | null>(null);
  const [wizardMode, setWizardMode] = useState<TokenVerificationMode>('deployer');

  const openWizard = (listing: PublishedTokenListing, mode: TokenVerificationMode) => {
    setWizardTarget(listing);
    setWizardMode(mode);
  };

  const claimablePanel =
    claimableSeeds.length > 0 && onClaimSeed ? (
      <ClaimableSeedsPanel seeds={claimableSeeds} onClaimSeed={onClaimSeed} />
    ) : null;

  if (listings.length === 0) {
    return (
      <div className="space-y-6">
        {claimablePanel}
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-10 text-center">
          <DAppSectionHeader title="Your token listings" className="mb-3 justify-center" />
          <p className="kx-body-sm max-w-md mx-auto mb-6">
            Published token pages appear here after you pay and verify on Kaspa L1.
          </p>
          <Link href="/tokens" className="k-cta-secondary text-sm">
            Browse ecosystem tokens
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {claimablePanel}
      <DAppSectionHeader title="Your token listings" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {listings.map((listing) => {
          const token = listingToToken(listing);
          const featuredImageUrl = loadTokenFeaturedImageUrl(token);
          const pill = paymentPill(listing.status);
          const canVerifyDeployer = listing.ownership !== 'deployer_verified';
          const isReal = listing.assetKind === 'real';
          const explorerUrl =
            listing.listingNetwork === 'kcc20'
              ? getProgrammableExplorerUrl(
                  listing.onChainSnapshot?.covenantId ?? listing.contractAddress,
                  listing.onChainSnapshot?.networkId,
                )
              : null;
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
                <TokenListingCardContent
                  token={token}
                  ownershipLabel={
                    <p className="text-xs font-semibold text-[#02abb8]">{ownershipLabel(listing)}</p>
                  }
                  footer={
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/tokens/${listing.slug}`} className="k-control-btn text-sm text-center">
                        View page
                      </Link>
                      <button type="button" onClick={() => onEdit(listing)} className="k-control-btn text-sm">
                        Edit
                      </button>
                      {explorerUrl ? (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="k-control-btn col-span-2 text-sm text-center"
                        >
                          View on KaspaCom Explorer
                        </a>
                      ) : null}
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
                      {listing.ownership === 'wallet_assigned' && onUnassignWallet ? (
                        <button
                          type="button"
                          onClick={() => void onUnassignWallet(listing.id)}
                          className="k-control-btn col-span-2 text-sm"
                        >
                          Unassign Wallet
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
                  }
                />
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
