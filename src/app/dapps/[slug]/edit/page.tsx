'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { placeholderDApps } from '@/lib/dapps';
import { generateDAppSlug } from '@/lib/utils';

// Generate static params for all dApp slugs (required for static export)
export async function generateStaticParams() {
  return placeholderDApps.map((dapp) => ({
    slug: dapp.slug || generateDAppSlug(dapp.name),
  }));
}

// Edit functionality removed - dApps are now read-only
// This page redirects to the dApp detail page
export default function DAppEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string | undefined;
  
  // Redirect to dApp page immediately
  useEffect(() => {
    if (slug) {
      router.replace(`/dapps/${slug}`);
    }
  }, [slug, router]);

  // Show loading state while redirecting
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-zinc-600 dark:text-zinc-400">Redirecting...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

