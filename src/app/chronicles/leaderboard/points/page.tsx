import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  CHRONICLES_LB_READ_CONFIRM_KAS,
  CHRONICLES_LB_SLOT_ACTIVATION_KAS,
  CHRONICLES_LB_SLOT_CHANGE_KAS,
} from '@/lib/chronicles/leaderboard/constants';
import { NFT_POINTS } from '@/lib/leaderboard/nftPoints';

export const metadata: Metadata = {
  title: "Points · Krex's Chronicles",
  description: 'Point values for all leaderboard actions and NFT slot bonuses.',
};

export default function ChroniclesLeaderboardPointsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Points</p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          How scores are calculated
        </h1>
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 mt-4 max-w-3xl leading-relaxed">
          Points are awarded from verified on-chain actions. NFT slot points depend on the collection type, with bonuses for certain rarities.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/chronicles/leaderboard" className="k-control-btn">
            Back to Leaderboard
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-6 chronicles-vault-card">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Actions</p>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
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
                  <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">
                    {CHRONICLES_LB_POINTS_PER_READ_CONFIRM}
                  </td>
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
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">NFT slot points</p>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                  <th className="py-3 pr-6">Collection type</th>
                  <th className="py-3 pr-6">Base points / NFT</th>
                  <th className="py-3 pr-6">Diamond</th>
                  <th className="py-3 pr-6">Rare</th>
                  <th className="py-3">Examples</th>
                </tr>
              </thead>
              <tbody className="text-zinc-700 dark:text-zinc-300">
                <tr className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="py-3 pr-6 font-semibold">Our collections</td>
                  <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.our.base}</td>
                  <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.our.diamond}</td>
                  <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.our.rare}</td>
                  <td className="py-3">{NFT_POINTS.ourCollections.join(', ')}</td>
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

          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            Points are counted per NFT inserted in an active slot. Slot 1 is always active; slots 2–3 must be activated.
          </p>
        </div>
      </div>
    </div>
  );
}

