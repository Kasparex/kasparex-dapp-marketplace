import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsSidebar } from '@/components/stats/StatsSidebar';
import { SmartContractsPage } from '@/components/stats/SmartContractsPage';

export const metadata: Metadata = {
  title: 'Smart Contracts · Kasparex Stats',
  description: 'Tree, table, and flow view of Kasparex smart contracts: addresses, descriptions, and relationships.',
};

export default function StatsContractsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <StatsSidebar />
        </div>
        <div className="lg:hidden">
          <StatsSidebar />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="relative mb-8 py-8 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
              <div className="relative z-10 w-full text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
                  Smart Contracts
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
                  Explore contracts by flow, tree, or table. View addresses and explorer links.
                </p>
                <div className="mt-4">
                  <Link
                    href="/stats"
                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    ← Back to Stats
                  </Link>
                </div>
              </div>
            </div>

            <SmartContractsPage />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
