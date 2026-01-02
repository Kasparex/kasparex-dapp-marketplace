'use client';

import dynamicImport from 'next/dynamic';
import { use } from 'react';
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

export default function EditListingPage({ params }: EditListingPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <EditListingContent id={id} />
      <Footer />
    </div>
  );
}

