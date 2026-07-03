'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateTokenForm } from '@/components/tokens/CreateTokenForm';
import { TokenAuthorPricing } from '@/components/tokens/TokenAuthorPricing';
import { TokenListingArchive } from '@/components/tokens/TokenListingArchive';
import { useTokens } from '@/hooks/useTokens';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import type { PublishedTokenListing } from '@/lib/tokens/listingRecord';
import { Alert } from '@/components/Alert';

export function TokenDeveloperDashboard() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const walletAddress = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);

  const { getAuthorListings, removeListing, listings } = useTokens();
  const [activeTab, setActiveTab] = useState<'create' | 'archive'>('create');
  const [editingListing, setEditingListing] = useState<PublishedTokenListing | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const authorListings = walletAddress ? getAuthorListings(walletAddress) : [];

  useEffect(() => {
    if (!editId) return;
    const match = listings.find((l) => l.id === editId) ?? null;
    if (match) {
      setEditingListing(match);
      setActiveTab('create');
    }
  }, [editId, listings]);

  const handlePublishSuccess = (listing: PublishedTokenListing) => {
    setSuccessMessage(
      listing.status === 'verified'
        ? `Token page published at /tokens/${listing.slug}`
        : `Listing saved. Verification pending for /tokens/${listing.slug}`,
    );
    setEditingListing(null);
    setActiveTab('archive');
    window.setTimeout(() => setSuccessMessage(null), 8000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this listing from your dashboard? The public page may still show until cache clears.')) {
      return;
    }
    await removeListing(id);
  };

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

      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => {
            setActiveTab('create');
            setEditingListing(null);
          }}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'create'
              ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          {editingListing ? 'Edit listing' : 'Create listing'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('archive')}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'archive'
              ? 'bg-white dark:bg-zinc-800 text-[#02abb8] dark:text-[#66dfe8] shadow-lg shadow-black/5 border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
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
              onSuccess={handlePublishSuccess}
              onCancelEdit={editingListing ? () => setEditingListing(null) : undefined}
            />
          </div>
        ) : (
          <div id="tokens-dashboard-archive" className="scroll-mt-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <TokenListingArchive
              listings={authorListings}
              onEdit={(listing) => {
                setEditingListing(listing);
                setActiveTab('create');
              }}
              onDelete={handleDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}
