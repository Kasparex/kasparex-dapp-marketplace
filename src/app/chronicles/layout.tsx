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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 overflow-x-hidden">
      <Header />
      <div className="flex flex-1 min-w-0 overflow-x-hidden">
        <ChroniclesSidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-x-hidden overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto min-w-0 w-full">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
    </ChroniclesUnlockProvider>
  );
}
