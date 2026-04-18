import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsSidebar } from '@/components/stats/StatsSidebar';
import { StatsPageContent } from '@/components/stats/StatsPageContent';

export const metadata: Metadata = {
  title: 'Kasparex Stats · Treasury & Ecosystem',
  description: 'Kasparex Treasury, Total Value Locked (TVL), and ecosystem statistics. Real data will replace placeholders in a future update.',
};

export default function StatsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row">
        <StatsSidebar />

        <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-8 lg:pl-6 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-6xl">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                Ecosystem Stats
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
                Treasury, TVL, and ecosystem metrics for the Kasparex platform.
              </p>
            </div>

            <StatsPageContent />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
