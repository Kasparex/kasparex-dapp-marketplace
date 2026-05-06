import type { Metadata } from 'next';
import Link from 'next/link';
import { ChroniclesLeaderboardTableLazy } from '@/components/chronicles/leaderboard/ChroniclesLeaderboardTableLazy';
import { SeasonProgressCard } from '@/components/leaderboard/SeasonProgressCard';
import { GlobalTop100Preview } from '@/components/leaderboard/GlobalTop100Preview';
import { ProjectedRewardsCards } from '@/components/leaderboard/ProjectedRewardsCards';
import { LeaderboardHaloHeader } from '@/components/leaderboard/LeaderboardHaloHeader';
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
            <LeaderboardHaloHeader />

            <div id="season-progress" className="scroll-mt-24">
              <SeasonProgressCard />
            </div>
            <div id="global-top-100" className="scroll-mt-24">
              <GlobalTop100Preview />
            </div>
            <div id="projected-rewards" className="scroll-mt-24">
              <ProjectedRewardsCards />
            </div>

            <div id="leaderboard-table" className="scroll-mt-24">
              <ChroniclesLeaderboardTableLazy initialRows={[]} seasonId={season.id} initialLimit={20} step={30} />
            </div>

            <div
              id="how-leaderboard-works"
              className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-3 chronicles-vault-card"
            >
              <p className="text-sm font-black uppercase tracking-widest text-[#02abb8]">How this leaderboard works</p>
              <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1 list-disc pl-5">
                <li><strong>Unified hub score</strong>: local rollup from the same ledger used on `/rewards` (new reads and NFT placements write into it).</li>
                <li><strong>Live season leaderboard</strong>: legacy Chronicles table fed by verified on-chain actions.</li>
                <li><strong>Global Top 100</strong>: immutable snapshot after season finalization.</li>
                <li><strong>Your season progress</strong>: local browser wallet preview and pending tx tracker.</li>
              </ul>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Points rules live in <Link href="/rewards#rewards-points" className="underline font-semibold">Points</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

