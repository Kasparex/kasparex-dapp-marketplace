'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IndexPageContent } from './IndexPageContent';

// Force dynamic rendering to prevent prerendering errors with useSearchParams
export const dynamic = 'force-dynamic';

export default function IndexPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Suspense fallback={
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center text-zinc-500 dark:text-zinc-400">Loading listings...</div>
        </main>
      }>
        <IndexPageContent />
      </Suspense>
      <Footer />
    </div>
  );
}

