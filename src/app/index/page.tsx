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
      <Suspense fallback={
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="text-zinc-500 dark:text-zinc-400 mb-4">Loading listings...</div>
              <div className="animate-pulse text-sm text-zinc-400 dark:text-zinc-500">
                Please wait
              </div>
            </div>
          </main>
          <Footer />
        </div>
      }>
        <IndexPageContent />
      </Suspense>
    </div>
  );
}

