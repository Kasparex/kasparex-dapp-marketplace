'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenLandingPage } from '@/components/tokens/TokenLandingPage';
import { useTokens } from '@/hooks/useTokens';
import type { Token } from '@/lib/tokens/types';
import type { PublishedTokenListing, TokenPageConfig } from '@/lib/tokens/listingRecord';
import { getPublishedListingBySlug } from '@/lib/tokens/data';
import { listingToToken } from '@/lib/tokens/listingRecord';

/**
 * Merge a dashboard-published listing over a registry (base) token. Editable fields
 * from the listing win; market/allocation data from the registry is preserved so
 * claimed ecosystem pages (KREX, GRID, KAS) keep their rich data after edits.
 */
function mergeListingOverBase(base: Token, listing: PublishedTokenListing): Token {
  const listingToken = listingToToken(listing);
  return {
    ...base,
    name: listingToken.name,
    symbol: listingToken.symbol,
    description: listingToken.description || base.description,
    shortDescription: listingToken.shortDescription ?? base.shortDescription,
    tags: listingToken.tags && listingToken.tags.length > 0 ? listingToken.tags : base.tags,
    logo: listingToken.logo ?? base.logo,
    logoCid: listingToken.logoCid ?? base.logoCid,
    featuredImage: listingToken.featuredImage ?? base.featuredImage,
    featuredImageCid: listingToken.featuredImageCid ?? base.featuredImageCid,
    network: listingToken.network ?? base.network,
    contractAddress: listingToken.contractAddress ?? base.contractAddress,
    l1Address: listingToken.l1Address ?? base.l1Address,
    l2Address: listingToken.l2Address ?? base.l2Address,
    networks: listing.networks?.length ? listing.networks : base.networks,
    listing: { ...base.listing, ...listingToken.listing },
    updatedAt: listing.updatedAt ?? base.updatedAt,
  };
}

interface TokenPageContentProps {
  slug: string;
  serverToken: Token | null;
}

export function TokenPageContent({ slug, serverToken }: TokenPageContentProps) {
  const { resolveToken, listings } = useTokens();
  const [token, setToken] = useState<Token | null>(serverToken);
  const [pageConfig, setPageConfig] = useState<TokenPageConfig | undefined>(undefined);
  const [ready, setReady] = useState(Boolean(serverToken));

  useEffect(() => {
    const listing = getPublishedListingBySlug(slug);
    if (serverToken) {
      // Registry token: reflect a claimed / edited dashboard listing if one exists.
      setToken(listing ? mergeListingOverBase(serverToken, listing) : serverToken);
      setPageConfig(listing?.pageConfig);
      setReady(true);
      return;
    }
    const resolved = resolveToken(slug, null);
    if (resolved) {
      setToken(resolved);
      setPageConfig(listing?.pageConfig);
      setReady(true);
    } else {
      setReady(true);
    }
  }, [slug, serverToken, resolveToken, listings]);

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex flex-1 items-center justify-center p-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading token…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!token) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex min-h-0 flex-1 flex-col">
        <TokenLandingPage token={token} pageConfig={pageConfig} />
      </main>
      <Footer />
    </div>
  );
}
