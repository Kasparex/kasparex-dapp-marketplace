import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdsSidebar } from '@/components/ads/AdsSidebar';

export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="flex flex-1">
        <AdsSidebar />
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
