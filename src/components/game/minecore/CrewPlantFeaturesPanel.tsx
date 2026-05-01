'use client';

import { useMemo } from 'react';
import type { MinecoreState } from '@/lib/game/minecore';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

export function CrewPlantFeaturesPanel(props: {
  plantSlots: MinecoreState['plantSlots'];
  autoRestartInfrastructureActive: boolean;
}) {
  const automationStats = useMemo(() => {
    const unlocked = props.plantSlots.filter((p) => p.unlocked);
    const withAuto = unlocked.filter((p) => p.autoRestartMining).length;
    return { unlockedCount: unlocked.length, plantsWithAuto: withAuto };
  }, [props.plantSlots]);

  return (
    <GamePanelCard title="How crew ties to Minecore" hint="Reference only. Toggle AUTO on each plant on the Mining tab.">
      <p className="mb-4 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
        Automation infra ready:{' '}
        <span
          className={
            props.autoRestartInfrastructureActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
          }
        >
          {props.autoRestartInfrastructureActive ? 'Yes' : 'No'}
        </span>
        {' · '}
        Plants with AUTO on:{' '}
        <span className="font-mono tabular-nums">
          {automationStats.unlockedCount === 0
            ? '0'
            : `${automationStats.plantsWithAuto}/${automationStats.unlockedCount}`}
        </span>
      </p>
      <div className="overflow-x-auto rounded-xl border border-zinc-100 dark:border-zinc-800">
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/60">
              <th className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300">Feature</th>
              <th className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300">Effect</th>
              <th className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300">Need</th>
              <th className="px-3 py-2 font-bold text-zinc-700 dark:text-zinc-300">Where</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <tr className="align-top">
              <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-200">Per-plant AUTO</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Chains next run if batteries hold charge.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Foreman on crew · infra (Foreman or Regen Coil).</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Mining · AUTO badge</td>
            </tr>
            <tr className="align-top">
              <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-200">Rolling cap bonus</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Flat D toward the 24h cap from NFT tiers.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Worker / Operator / Foreman NFTs in deck.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Workers slots · bind row per plant</td>
            </tr>
            <tr className="align-top">
              <td className="px-3 py-2 font-semibold text-zinc-800 dark:text-zinc-200">Battery runtime</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Extra stored runtime from tier perks.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Qualifying NFTs slotted.</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">Passive · plant Energy</td>
            </tr>
          </tbody>
        </table>
      </div>
    </GamePanelCard>
  );
}
