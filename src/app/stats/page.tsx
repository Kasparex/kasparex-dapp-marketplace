import { Metadata } from 'next';
import Link from 'next/link';
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

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Global sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <StatsSidebar />
        </div>
        <div className="lg:hidden">
          <StatsSidebar />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            {/* Hero - same structure as Nodes, violet accent */}
            <div className="relative mb-12 py-12 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-violet-50/50 to-zinc-100 dark:from-zinc-950 dark:via-violet-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#8b5cf6,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#7c3aed,transparent_50%)]" />
              </div>
              <div className="relative z-10 w-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                  </span>
                  Ecosystem stats
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
                  Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-400 dark:to-violet-300">Stats</span>
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed mb-8">
                  Treasury, TVL, and ecosystem metrics. This page will be updated with real data in a future release.
                </p>
                <Link
                  href="/hub"
                  className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  ← Back to Hub
                </Link>
              </div>
            </div>

            <StatsPageContent />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
