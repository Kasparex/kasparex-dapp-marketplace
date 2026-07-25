'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenLandingPage } from '@/components/tokens/TokenLandingPage';
import { useTokens } from '@/hooks/useTokens';
import type { Token } from '@/lib/tokens/types';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';
import { getPublishedListingBySlug } from '@/lib/tokens/data';
import { mergeListingOverBase } from '@/lib/tokens/listingRecord';

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
      <main className="flex flex-1 flex-col lg:flex-row">
        <TokenLandingPage token={token} pageConfig={pageConfig} />
      </main>
      <Footer />
    </div>
  );
}
