'use client';

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Dynamically import IndexPageContent with no SSR to prevent build-time evaluation
const IndexPageContent = dynamicImport(
  () => import('./IndexPageContent').then(mod => ({ default: mod.IndexPageContent })),
  { ssr: false }
);

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

function IndexPageContentWrapper() {
  return <IndexPageContent />;
}

export default function IndexPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center text-zinc-600 dark:text-zinc-400">
              Loading listings...
            </div>
          </div>
        }>
          <IndexPageContentWrapper />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

