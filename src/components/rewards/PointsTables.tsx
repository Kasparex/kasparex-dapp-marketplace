'use client';

import { NFT_POINTS } from '@/lib/leaderboard/nftPoints';
import {
  CHRONICLES_LB_POINTS_PER_READ_CONFIRM,
  CHRONICLES_LB_READ_CONFIRM_KAS,
  CHRONICLES_LB_SLOT_ACTIVATION_KAS,
  CHRONICLES_LB_SLOT_CHANGE_KAS,
} from '@/lib/chronicles/leaderboard/constants';

export function PointsTables() {
  return (
    <div className="space-y-8">
      <div
        id="module-scoring-rules"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-6"
      >
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Module scoring rules</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            The global leaderboard score is computed from unlocked modules. These tables show the current rules for Confirmed Reads and NFT Slots.
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
                <td className="py-3 pr-6 font-semibold" title="One read confirmation per entity per wallet in each season.">Confirm read</td>
                <td className="py-3 pr-6">{CHRONICLES_LB_READ_CONFIRM_KAS} KAS</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{CHRONICLES_LB_POINTS_PER_READ_CONFIRM}</td>
                <td className="py-3">One per entity per wallet per season.</td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold" title="Activation unlocks slots 2 and 3 for scoring in the current season.">Activate slot (2–3)</td>
                <td className="py-3 pr-6">{CHRONICLES_LB_SLOT_ACTIVATION_KAS} KAS</td>
                <td className="py-3 pr-6"> - </td>
                <td className="py-3">Unlocks slot for scoring.</td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold" title="Set and clear updates use last-write-wins and only active slots count.">Set / clear slot</td>
                <td className="py-3 pr-6">{CHRONICLES_LB_SLOT_CHANGE_KAS} KAS</td>
                <td className="py-3 pr-6"> - </td>
                <td className="py-3">Score comes from what’s currently inserted in active slots.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        id="nft-slot-points"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-6"
      >
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">NFT slot points</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Slot points depend on collection type and rarity tiers.
          </p>
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
                <td className="py-3 pr-6"> - </td>
                <td className="py-3 pr-6"> - </td>
                <td className="py-3">{Object.keys(NFT_POINTS.partnerCollections).join(', ') || '-'}</td>
              </tr>
              <tr className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-3 pr-6 font-semibold">Standard collections</td>
                <td className="py-3 pr-6 font-black text-zinc-900 dark:text-zinc-100">{NFT_POINTS.standard.base}</td>
                <td className="py-3 pr-6"> - </td>
                <td className="py-3 pr-6"> - </td>
                <td className="py-3">Any other supported collection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

