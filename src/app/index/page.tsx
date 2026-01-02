'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { IndexPageContent } from './IndexPageContent';

export default function IndexPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <IndexPageContent />
      </main>
      <Footer />
    </div>
  );
}

