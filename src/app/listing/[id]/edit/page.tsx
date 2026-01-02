'use client';

import { use } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { EditListingContent } from './EditListingContent';

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <EditListingContent id={id} />
      </main>
      <Footer />
    </div>
  );
}

