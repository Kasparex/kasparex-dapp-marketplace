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

      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row">
        <StatsSidebar />

        <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-12 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-6xl">
            <div className="relative mb-8 py-10 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-violet-50/50 to-zinc-100 dark:from-zinc-950 dark:via-violet-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#8b5cf6,transparent_50%)]" />
              </div>
              <div className="relative z-10 w-full">
                <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-2">
                  Smart Contracts
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mb-4">
                  Explore contracts by flow, tree, or table. Addresses link to the block explorer.
                </p>
                <Link
                  href="/stats"
                  className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  ← Back to Stats
                </Link>
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
