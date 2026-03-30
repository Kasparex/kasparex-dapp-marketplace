import type { Metadata } from 'next';
import Link from 'next/link';
import { computeChroniclesLeaderboard } from '@/lib/chronicles/leaderboard/compute';
import { ChroniclesLeaderboardTableLazy } from '@/components/chronicles/leaderboard/ChroniclesLeaderboardTableLazy';
import { SeasonProgressCard } from '@/components/leaderboard/SeasonProgressCard';
import { GlobalTop100Preview } from '@/components/leaderboard/GlobalTop100Preview';
import { NFT_POINTS } from '@/lib/leaderboard/nftPoints';
import {
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  CHRONICLES_LB_READ_CONFIRM_KAS,
  CHRONICLES_LB_SLOT_ACTIVATION_KAS,
  CHRONICLES_LB_SLOT_CHANGE_KAS,
} from '@/lib/chronicles/leaderboard/constants';

export const metadata: Metadata = {
  title: "Leaderboard · Krex's Chronicles",
  description: 'On-chain leaderboard for reads and NFT slots in Krex’s Chronicles.',
};

export default async function ChroniclesLeaderboardPage() {
  const initialRows = await computeChroniclesLeaderboard({ limit: 1200 });
  const rows = initialRows.slice(0, 20);

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

      <SeasonProgressCard />
      <GlobalTop100Preview />

      <ChroniclesLeaderboardTableLazy initialRows={rows} initialLimit={20} step={30} />

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-6 chronicles-vault-card">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Points</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Scores are based on verified on-chain actions. Slot points depend on collection type and Premium rarity tiers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                <th className="py-3 pr-6">Action</th>
                <th className="py-3 pr-6">Cost</th>
                <th className="py-3 pr-6">Points</th>
                <th className="py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700 dark:text-zinc-300">
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold">Confirm read</td>
                <td className="py-3 pr-6">{CHRONICLES_LB_READ_CONFIRM_KAS} KAS</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{CHRONICLES_LB_POINTS_PER_READ_CONFIRM}</td>
                <td className="py-3">One per entity per wallet per season.</td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold">Activate slot (2–3)</td>
                <td className="py-3 pr-6">{CHRONICLES_LB_SLOT_ACTIVATION_KAS} KAS</td>
                <td className="py-3 pr-6">—</td>
                <td className="py-3">Unlocks slot for scoring.</td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold">Set / clear slot</td>
                <td className="py-3 pr-6">{CHRONICLES_LB_SLOT_CHANGE_KAS} KAS</td>
                <td className="py-3 pr-6">—</td>
                <td className="py-3">Score comes from what’s currently inserted in active slots.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                <th className="py-3 pr-6">Collection type</th>
                <th className="py-3 pr-6">Base / NFT</th>
                <th className="py-3 pr-6">Diamond</th>
                <th className="py-3 pr-6">Rare</th>
                <th className="py-3">Examples</th>
              </tr>
            </thead>
            <tbody className="text-zinc-700 dark:text-zinc-300">
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold">Premium collections</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.premium.base}</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.premium.diamond}</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.premium.rare}</td>
                <td className="py-3">{NFT_POINTS.premiumCollections.join(', ')}</td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold">Partner collections</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.partner.base}</td>
                <td className="py-3 pr-6">—</td>
                <td className="py-3 pr-6">—</td>
                <td className="py-3">{Object.keys(NFT_POINTS.partnerCollections).join(', ') || '—'}</td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold">Standard collections</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.standard.base}</td>
                <td className="py-3 pr-6">—</td>
                <td className="py-3 pr-6">—</td>
                <td className="py-3">Any other supported collection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

