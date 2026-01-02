'use client';

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Dynamically import CreateListingContent with no SSR
const CreateListingContent = dynamicImport(
  () => import('./CreateListingContent').then(mod => ({ default: mod.CreateListingContent })),
  { ssr: false }
);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function CreateListingContentWrapper() {
  return <CreateListingContent />;
}

export default function CreateListingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center text-zinc-600 dark:text-zinc-400">
              Loading form...
            </div>
          </div>
        }>
          <CreateListingContentWrapper />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

