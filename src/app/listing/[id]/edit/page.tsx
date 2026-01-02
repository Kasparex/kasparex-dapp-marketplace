'use client';

import dynamicImport from 'next/dynamic';
import { use, Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

// Dynamically import EditListingContent with no SSR
const EditListingContent = dynamicImport(
  () => import('./EditListingContent').then(mod => ({ default: mod.EditListingContent })),
  { ssr: false }
);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

function EditListingContentWrapper({ id }: { id: string }) {
  return <EditListingContent id={id} />;
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center text-zinc-600 dark:text-zinc-400">
              Loading edit form...
            </div>
          </div>
        }>
          <EditListingContentWrapper id={id} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

