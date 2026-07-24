'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChroniclesSidebar } from '@/components/chronicles/ChroniclesSidebar';
import { ChroniclesUnlockProvider } from '@/components/chronicles/ChroniclesUnlockProvider';

export default function ChroniclesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith('/chronicles/center')) {
    return <ChroniclesUnlockProvider>{children}</ChroniclesUnlockProvider>;
  }

  return (
    <ChroniclesUnlockProvider>
      {/*
        Avoid overflow-x:hidden on ancestors of Header: it breaks position:sticky.
        Window scroll keeps the Hub menu sticky like Games / Tokens / dApps.
      */}
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <div className="flex min-w-0 flex-1">
          <ChroniclesSidebar />
          <main className="min-w-0 flex-1 border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:p-8 lg:pl-6">
            <div className="mx-auto w-full min-w-0 max-w-7xl">{children}</div>
          </main>
        </div>
        <Footer />
      </div>
    </ChroniclesUnlockProvider>
  );
}
