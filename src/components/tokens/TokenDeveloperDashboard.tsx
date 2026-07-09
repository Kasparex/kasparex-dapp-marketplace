'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateTokenForm } from '@/components/tokens/CreateTokenForm';
import { TokenListingArchive } from '@/components/tokens/TokenListingArchive';
import {
  EMPTY_TOKEN_LISTING_MEDIA,
  type TokenListingMediaState,
} from '@/components/tokens/TokenListingMediaPanel';
import { useTokens } from '@/hooks/useTokens';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { normalizeIpfsUrlForForm } from '@/lib/hub/ipfsStandard';
import { HUB_DELETE_FEE_KAS } from '@/lib/hub/paidDelete';
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import { Alert } from '@/components/Alert';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { MobileWalletUnavailableNotice } from '@/components/hub/MobileWalletUnavailableNotice';

function mediaFromListing(listing: PublishedTokenListing | null): TokenListingMediaState {
  if (!listing) return { ...EMPTY_TOKEN_LISTING_MEDIA };
  const logoUrl = normalizeIpfsUrlForForm(listing.logoUrl, listing.logoCid);
  const featuredUrl = normalizeIpfsUrlForForm(listing.featuredImageUrl, listing.featuredImageCid);
  const hasLogo = Boolean(logoUrl);
  const hasFeatured = Boolean(featuredUrl);
  return {
    logoSource: hasLogo ? 'url' : 'file',
    logoUrl,
    logoCid: listing.logoCid ?? null,
    logoName: listing.logoCid ? 'Uploaded logo' : null,
    featuredSource: hasFeatured ? 'url' : 'file',
    featuredUrl,
    featuredCid: listing.featuredImageCid ?? null,
    featuredName: listing.featuredImageCid ? 'Uploaded banner' : null,
  };
}

export function TokenDeveloperDashboard() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isMobile = useIsMobileViewport();
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);
  const { confirm } = useKxSystemDialog();

  const {
    getAuthorListings,
    removeListing,
    verifyDeployer,
    assignWallet,
    unassignWallet,
    getClaimableSeedsForWallet,
    claimSeedToken,
    listings,
  } = useTokens();
  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');
  const [editingListing, setEditingListing] = useState<PublishedTokenListing | null>(null);
  const [media, setMedia] = useState<TokenListingMediaState>(EMPTY_TOKEN_LISTING_MEDIA);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verifyBannerListing, setVerifyBannerListing] = useState<PublishedTokenListing | null>(null);

  const authorListings = walletAddress ? getAuthorListings(walletAddress) : [];
  const claimableSeeds = getClaimableSeedsForWallet(kaspaState.address);

  useEffect(() => {
    if (!editId) return;
    const match = listings.find((l) => l.id === editId) ?? null;
    if (match) {
      setEditingListing(match);
      setMedia(mediaFromListing(match));
      setActiveTab('create');
    }
  }, [editId, listings]);

  useEffect(() => {
    if (editingListing) {
      setMedia(mediaFromListing(editingListing));
    }
  }, [editingListing]);

  const handlePublishSuccess = (listing: PublishedTokenListing) => {
    setSuccessMessage(
      listing.status === 'verified' || listing.status === 'published'
        ? `Token page published at /tokens/${listing.slug}`
        : `Listing saved. Payment pending for /tokens/${listing.slug}`,
    );
    setEditingListing(null);
    setMedia(EMPTY_TOKEN_LISTING_MEDIA);
    setActiveTab('archive');
    if (listing.assetKind === 'real' && listing.ownership !== 'deployer_verified') {
      setVerifyBannerListing(listing);
    }
    window.setTimeout(() => setSuccessMessage(null), 8000);
  };

  const handleDelete = async (id: string) => {
    const deleteFee = HUB_DELETE_FEE_KAS.tokens;
    const ok = await confirm({
      title: 'Remove listing',
      message: `Remove this listing from your dashboard? A ${deleteFee} KAS fee applies. The public page may still show until cache clears.`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeListing(id);
    } catch (e) {
      setSuccessMessage(e instanceof Error ? e.message : 'Could not remove listing.');
      window.setTimeout(() => setSuccessMessage(null), 8000);
    }
  };

  const handleVerifyDeployer = async (id: string, proof: { method: string; walletAddress: string; signature?: string }) => {
    const result = await verifyDeployer(id, proof);
    if (result) {
      setVerifyBannerListing(null);
      setSuccessMessage(`${result.symbol} deployer verified. +1000 Hub Points awarded. Hub integrations can go live.`);
      window.setTimeout(() => setSuccessMessage(null), 8000);
    }
  };

  const handleAssignWallet = async (id: string, proof: { method: string; walletAddress: string; signature?: string }) => {
    const result = await assignWallet(id, proof);
    if (result) {
      setSuccessMessage(`Wallet assigned to ${result.symbol}. Listing stays under Community Collaboration Tokens.`);
      window.setTimeout(() => setSuccessMessage(null), 8000);
    }
  };

  const handleUnassignWallet = async (id: string) => {
    const ok = await confirm({
      title: 'Unassign wallet',
      message: 'Unassign your wallet from this token page? You can re-assign it later.',
      confirmLabel: 'Unassign',
      destructive: true,
    });
    if (!ok) return;
    try {
      const result = await unassignWallet(id);
      if (result) {
        setSuccessMessage(`Wallet unassigned from ${result.symbol}.`);
        window.setTimeout(() => setSuccessMessage(null), 8000);
      }
    } catch (e) {
      setSuccessMessage(e instanceof Error ? e.message : 'Could not unassign wallet.');
      window.setTimeout(() => setSuccessMessage(null), 8000);
    }
  };

  const handleClaimSeed = async (seed: Parameters<typeof claimSeedToken>[0]) => {
    if (!kaspaState.address) return;
    const result = await claimSeedToken(seed, kaspaState.address);
    if (result) {
      setSuccessMessage(`${result.symbol} page claimed. You can now edit and manage it from your dashboard.`);
      window.setTimeout(() => setSuccessMessage(null), 8000);
    }
  };

  const tabClass = (tab: typeof activeTab) =>
    `px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      activeTab === tab
        ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
    }`;

  return (
    <div className="space-y-8">
      <div id="tokens-dashboard-create" className="scroll-mt-24" />

      {successMessage ? (
        <Alert type="success" title="Success">
          {successMessage}{' '}
          <Link href="/tokens" className="underline font-semibold">
            View directory
          </Link>
        </Alert>
      ) : null}

      {verifyBannerListing ? (
        <Alert type="info" title="Activate Hub integrations">
          <p className="mb-3">
            <strong>{verifyBannerListing.name}</strong> is published. Verify your deployer wallet (free signature) to
            activate Store and vBlog integrations.
          </p>
          <button
            type="button"
            className="k-control-btn !border-[#02abb8] !text-[#02abb8]"
            onClick={() => {
              setActiveTab('archive');
              setVerifyBannerListing(verifyBannerListing);
            }}
          >
            Go to My tokens to verify
          </button>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button type="button" onClick={() => setActiveTab('create')} className={tabClass('create')}>
          {editingListing ? 'Edit listing' : 'Create listing'}
        </button>
        <button type="button" onClick={() => setActiveTab('archive')} className={tabClass('archive')}>
          My tokens ({authorListings.length})
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'create' ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {isMobile ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <MobileWalletUnavailableNotice networks="L1" defaultOpen />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  The full listing builder works best on desktop. On mobile you can manage published listings and verify
                  deployer ownership.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('archive')}
                  className="k-control-btn !border-[#02abb8] !text-[#02abb8]"
                >
                  Open My tokens
                </button>
              </div>
            ) : (
              <CreateTokenForm
                listing={editingListing}
                media={media}
                onMediaChange={setMedia}
                onSuccess={handlePublishSuccess}
                onCancelEdit={editingListing ? () => setEditingListing(null) : undefined}
              />
            )}
          </div>
        ) : null}

        {activeTab === 'archive' ? (
          <div id="tokens-dashboard-archive" className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TokenListingArchive
              listings={authorListings}
              highlightListingId={verifyBannerListing?.id}
              onEdit={(listing) => {
                setEditingListing(listing);
                setMedia(mediaFromListing(listing));
                setActiveTab('create');
              }}
              onDelete={handleDelete}
              onVerifyDeployer={handleVerifyDeployer}
              onAssignWallet={handleAssignWallet}
              onUnassignWallet={handleUnassignWallet}
              claimableSeeds={claimableSeeds}
              onClaimSeed={handleClaimSeed}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
