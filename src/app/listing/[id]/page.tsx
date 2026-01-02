'use client';

import { use } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ListingDetailContent } from './ListingDetailContent';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <ListingDetailContent id={id} />
      </main>
      <Footer />
    </div>
  );
}

