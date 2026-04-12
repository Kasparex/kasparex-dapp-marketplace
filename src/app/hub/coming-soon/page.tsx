'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useRequestHost } from '@/components/CanonicalNavContext';
import { canonicalAppHref, canonicalDappsMarketplaceHref } from '@/lib/config/sectionHosts';

export default function ComingSoonPage() {
  const host = useRequestHost();
  const hubHref = useMemo(() => canonicalAppHref('/hub', host ?? undefined), [host]);
  const marketplaceHref = useMemo(() => canonicalDappsMarketplaceHref(host ?? undefined), [host]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <svg 
              className="w-24 h-24 mx-auto text-zinc-400 dark:text-zinc-600 mb-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Coming Soon
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
              This project is currently under development. Check back soon for updates!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={hubHref}
              className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Back to Hub
            </Link>
            <Link
              href={marketplaceHref}
              className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Browse dApps
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

