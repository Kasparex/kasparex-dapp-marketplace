'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CreateListingContent } from './CreateListingContent';

export default function CreateListingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <CreateListingContent />
      </main>
      <Footer />
    </div>
  );
}

