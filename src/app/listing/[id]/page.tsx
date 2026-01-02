'use client';

import dynamicImport from 'next/dynamic';
import { use, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Dynamically import ListingDetailContent with no SSR
const ListingDetailContent = dynamicImport(
  () => import('./ListingDetailContent').then(mod => ({ default: mod.ListingDetailContent })),
  { ssr: false }
);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

function ListingDetailContentWrapper({ id }: { id: string }) {
  return <ListingDetailContent id={id} />;
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center text-zinc-600 dark:text-zinc-400">
              Loading listing...
            </div>
          </div>
        }>
          <ListingDetailContentWrapper id={id} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

