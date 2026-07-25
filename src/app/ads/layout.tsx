import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdsSidebar } from '@/components/ads/AdsSidebar';
import { HubAccentScope } from '@/components/hub/HubAccentScope';

export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <HubAccentScope projectId="kasparex-ads" className="flex min-h-0 flex-1">
        <AdsSidebar />
        <main className="w-full flex-1 overflow-y-auto border-l border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:p-8 lg:pl-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </HubAccentScope>
      <Footer />
    </div>
  );
}
