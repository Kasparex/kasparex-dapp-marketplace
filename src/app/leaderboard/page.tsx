import type { Metadata } from 'next';
import Link from 'next/link';
import { ChroniclesLeaderboardTableLazy } from '@/components/chronicles/leaderboard/ChroniclesLeaderboardTableLazy';
import { SeasonProgressCard } from '@/components/leaderboard/SeasonProgressCard';
import { GlobalTop100Preview } from '@/components/leaderboard/GlobalTop100Preview';
import { ProjectedRewardsCards } from '@/components/leaderboard/ProjectedRewardsCards';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LeaderboardSidebar } from '@/components/leaderboard/LeaderboardSidebar';

export const metadata: Metadata = {
  title: 'Leaderboard · Kasparex',
  description: 'Global on-chain leaderboard for Kasparex Hub activities.',
};

export default function LeaderboardPage() {
  const season = currentSeasonWindowUtc();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <LeaderboardSidebar />
        </div>
        <div className="lg:hidden">
          <LeaderboardSidebar />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="space-y-8 pb-12">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Leaderboard</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Top contributors
              </h1>
              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-4 max-w-3xl leading-relaxed">
                Scores are derived from verified on-chain actions and unlocked modules.
              </p>
              <p
                className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 inline-flex rounded-lg border border-zinc-300/70 dark:border-zinc-700 px-3 py-1"
                title="This table only includes verified events inside this UTC month season."
              >
                Live season: <span className="font-mono ml-1">{season.id}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/hub" className="k-control-btn">
                  Back to Hub
                </Link>
                <Link href="/chronicles/dashboard" className="k-control-btn">
                  Vault &amp; unlocks
                </Link>
              </div>
            </div>

            <SeasonProgressCard />
            <GlobalTop100Preview />
            <ProjectedRewardsCards />

            <ChroniclesLeaderboardTableLazy initialRows={[]} seasonId={season.id} initialLimit={20} step={30} />

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-3 chronicles-vault-card">
              <p className="text-sm font-black uppercase tracking-widest text-[#02abb8]">How this leaderboard works</p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-5">
                <li><strong>Live season leaderboard</strong>: monthly UTC ranking from verified on-chain actions.</li>
                <li><strong>Global Top 100</strong>: immutable snapshot after season finalization.</li>
                <li><strong>Your season progress</strong>: local browser wallet preview and pending tx tracker.</li>
              </ul>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Points rules live in <Link href="/points" className="underline font-semibold">Points</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

