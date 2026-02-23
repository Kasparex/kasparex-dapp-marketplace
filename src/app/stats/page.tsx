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
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="relative mb-8 py-10 px-6 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/40 dark:to-zinc-950 border border-zinc-200 dark:border-transparent">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#06b6d4,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,#0891b2,transparent_50%)]" />
              </div>
              <div className="relative z-10 w-full text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                  </span>
                  Ecosystem stats
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
                  Kasparex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-500 dark:from-cyan-400 dark:to-cyan-300">Stats</span>
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                  Treasury, TVL, and ecosystem metrics. This page will be updated with real data in a future release.
                </p>
                <div className="mt-6">
                  <Link
                    href="/hub"
                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    ← Back to Hub
                  </Link>
                </div>
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
