'use client';

import { GameSectionHeader } from '@/components/games/layout/GameSectionHeader';

export function CrewPlantFeaturesPanel() {
  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <GameSectionHeader
          title="How crew ties to Minecore"
          hint="Reference only. Toggle AUTO on each plant on the Mining tab."
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <table className="w-full min-w-[440px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
              <th className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300">Feature</th>
              <th className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300">Effect</th>
              <th className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300">Need</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <tr className="align-top">
              <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-200">Per-plant AUTO</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Chains next run if batteries hold charge.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Foreman linked in plant Crew · infra OK.</td>
            </tr>
            <tr className="align-top">
              <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-200">Rolling cap bonus</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Flat D toward the 24h cap from NFT tiers.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Worker / Operator / Foreman NFTs in deck.</td>
            </tr>
            <tr className="align-top">
              <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-200">Battery runtime</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Extra stored runtime from tier perks.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Qualifying NFTs slotted.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
