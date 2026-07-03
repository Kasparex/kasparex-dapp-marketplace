'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateTokenForm } from '@/components/tokens/CreateTokenForm';
import { TokenAuthorPricing } from '@/components/tokens/TokenAuthorPricing';
import { TokenListingArchive } from '@/components/tokens/TokenListingArchive';
import {
  EMPTY_TOKEN_LISTING_MEDIA,
  type TokenListingMediaState,
} from '@/components/tokens/TokenListingMediaPanel';
import { useTokens } from '@/hooks/useTokens';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { Alert } from '@/components/Alert';

function mediaFromListing(listing: PublishedTokenListing | null): TokenListingMediaState {
  if (!listing) return { ...EMPTY_TOKEN_LISTING_MEDIA };
  return {
    logoSource: listing.logoUrl ? 'url' : listing.logoCid ? 'file' : 'file',
    logoUrl: listing.logoUrl ?? '',
    logoCid: listing.logoCid ?? null,
    logoName: listing.logoCid ? 'Uploaded logo' : null,
    featuredSource: listing.featuredImageUrl ? 'url' : listing.featuredImageCid ? 'file' : 'file',
    featuredUrl: listing.featuredImageUrl ?? (listing.featuredImageCid ? getBestGatewayUrl(listing.featuredImageCid) : ''),
    featuredCid: listing.featuredImageCid ?? null,
    featuredName: listing.featuredImageCid ? 'Uploaded banner' : null,
  };
}

export function TokenDeveloperDashboard() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);

  const { getAuthorListings, removeListing, verifyListing, listings } = useTokens();
  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');
  const [editingListing, setEditingListing] = useState<PublishedTokenListing | null>(null);
  const [media, setMedia] = useState<TokenListingMediaState>(EMPTY_TOKEN_LISTING_MEDIA);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const authorListings = walletAddress ? getAuthorListings(walletAddress) : [];

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
      listing.status === 'verified'
        ? `Token page published at /tokens/${listing.slug}`
        : `Listing saved. Verification pending for /tokens/${listing.slug}`,
    );
    setEditingListing(null);
    setMedia(EMPTY_TOKEN_LISTING_MEDIA);
    setActiveTab('archive');
    window.setTimeout(() => setSuccessMessage(null), 8000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this listing from your dashboard? The public page may still show until cache clears.')) {
      return;
    }
    await removeListing(id);
  };

  const handleVerify = async (id: string, proof: { method: string; walletAddress: string; signature?: string }) => {
    const result = await verifyListing(id, proof);
    if (result) {
      setSuccessMessage(`${result.symbol} is now verified. Hub Points awarded for verification.`);
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

      <div className="flex flex-wrap items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button type="button" onClick={() => setActiveTab('create')} className={tabClass('create')}>
          {editingListing ? 'Edit listing' : 'Create listing'}
        </button>
        <button type="button" onClick={() => setActiveTab('archive')} className={tabClass('archive')}>
          My tokens ({authorListings.length})
        </button>
      </div>

      {activeTab === 'create' ? (
        <div id="tokens-dashboard-pricing" className="scroll-mt-24">
          <TokenAuthorPricing />
        </div>
      ) : null}

      <div className="min-h-[400px]">
        {activeTab === 'create' ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <CreateTokenForm
              listing={editingListing}
              media={media}
              onMediaChange={setMedia}
              onSuccess={handlePublishSuccess}
              onCancelEdit={editingListing ? () => setEditingListing(null) : undefined}
            />
          </div>
        ) : null}

        {activeTab === 'archive' ? (
          <div id="tokens-dashboard-archive" className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TokenListingArchive
              listings={authorListings}
              onEdit={(listing) => {
                setEditingListing(listing);
                setMedia(mediaFromListing(listing));
                setActiveTab('create');
              }}
              onDelete={handleDelete}
              onVerify={handleVerify}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
