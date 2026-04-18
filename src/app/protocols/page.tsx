import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProtocolsHomeContent } from './ProtocolsHomeClient';

export default function ProtocolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex flex-1 items-center justify-center p-8">
              <div className="text-center">
                <div className="mb-4 text-zinc-500 dark:text-zinc-400">Loading protocols…</div>
                <div className="animate-pulse text-sm text-zinc-400 dark:text-zinc-500">Please wait</div>
              </div>
            </main>
            <Footer />
          </div>
        }
      >
        <ProtocolsHomeContent />
      </Suspense>
    </div>
  );
}
