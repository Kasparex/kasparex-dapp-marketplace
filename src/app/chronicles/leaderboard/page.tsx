import type { Metadata } from 'next';
import Link from 'next/link';
import { computeChroniclesLeaderboard } from '@/lib/chronicles/leaderboard/compute';
import { ChroniclesLeaderboardTable } from '@/components/chronicles/leaderboard/ChroniclesLeaderboardTable';

export const metadata: Metadata = {
  title: "Leaderboard · Krex's Chronicles",
  description: 'On-chain leaderboard for reads and NFT slots in Krex’s Chronicles.',
};

export default async function ChroniclesLeaderboardPage() {
  const rows = await computeChroniclesLeaderboard({ limit: 300 });

  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Chronicles leaderboard</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Top readers and collectors
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-4 max-w-3xl leading-relaxed">
          Scores are derived from treasury transactions that confirm reads and slot actions. Confirming a read awards points,
          and filling active slots adds points to your total.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/chronicles" className="k-control-btn">
            Back to Chronicles
          </Link>
          <Link href="/chronicles/dashboard" className="k-control-btn">
            Vault
          </Link>
        </div>
      </div>

      <ChroniclesLeaderboardTable rows={rows} />
    </div>
  );
}

