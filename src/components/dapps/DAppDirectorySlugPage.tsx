'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DAppSidebar } from '@/components/DAppSidebar';
import { DirectoryDAppDetail } from '@/components/dapps/DirectoryDAppDetail';
import { DAppFooter } from '@/components/dapps/DAppFooter';
import { RelatedDApps } from '@/components/dapps/RelatedDApps';
import { DirectoryDAppSlugPageShell } from '@/components/dapps/DAppSlugPageShell';
import {
  directoryListingToDApp,
  getDirectoryListingBySlug,
} from '@/lib/dapps/listingSubmissions';

type DAppDirectorySlugPageProps = {
  slug: string;
};

export function DAppDirectorySlugPage({ slug }: DAppDirectorySlugPageProps) {
  const [ready, setReady] = useState(false);
  const [listing, setListing] = useState<ReturnType<typeof getDirectoryListingBySlug>>(undefined);

  useEffect(() => {
    const load = () => {
      setListing(getDirectoryListingBySlug(slug));
      setReady(true);
    };
    load();
    window.addEventListener('dapp-listing-submissions-updated', load);
    return () => window.removeEventListener('dapp-listing-submissions-updated', load);
  }, [slug]);

  const dapp = useMemo(() => (listing ? directoryListingToDApp(listing) : undefined), [listing]);

  if (!ready) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing || !dapp) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">
        <DirectoryDAppSlugPageShell dapp={dapp}>
          <div className="flex-1 flex flex-col lg:flex-row">
            <DAppSidebar dapp={dapp} />
            <div className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:px-16 lg:py-12">
              <DirectoryDAppDetail dapp={dapp} listing={listing} />
              <DAppFooter contractAddress="" />
            </div>
          </div>
          <div className="px-4 sm:px-6 lg:px-8 lg:pl-6 pb-4 sm:pb-6 lg:pb-8">
            <RelatedDApps currentDApp={dapp} />
          </div>
        </DirectoryDAppSlugPageShell>
      </main>
      <Footer />
    </div>
  );
}
