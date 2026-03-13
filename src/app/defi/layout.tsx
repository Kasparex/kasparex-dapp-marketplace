'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DeFiSidebar } from '@/components/defi/DeFiSidebar';

export default function DeFiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row bg-zinc-50 dark:bg-zinc-950">
        <div className="flex-shrink-0">
          <DeFiSidebar />
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
