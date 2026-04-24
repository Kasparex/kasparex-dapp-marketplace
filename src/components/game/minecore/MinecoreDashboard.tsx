'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GameTabs } from '@/components/games/layout/GameTabs';
import { GameDeckPanel } from '@/components/games/panels/GameDeckPanel';
import { TooltipProvider, Tooltip } from '@/components/ui/Tooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { useMinecore } from '@/hooks/useMinecore';
import { PlantSlotCard } from '@/components/game/minecore/PlantSlotCard';
import { FabricationPanel } from '@/components/game/minecore/FabricationPanel';

const TABS = [
  { id: 'mining', label: 'Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" /> },
  { id: 'fabrication', label: 'Fabrication' },
  { id: 'rewards', label: 'Rewards' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function MinecoreDashboard(_props: {
  featuredImage?: string;
  loreStory?: string;
  gameDescription?: string;
  game?: any;
  gameName?: string;
}) {
  const { state, actions, lastPaymentError } = useMinecore();
  const [tab, setTab] = useState<TabId>('mining');

  const pendingGrid = 0;
  const resources = useMemo(
    () => [
      {
        id: 'diamonds',
        label: 'Diamonds',
        value: Math.floor(state.diamondsBalance).toLocaleString(),
        subValue: `${Math.floor(state.refinementPointsTotal).toLocaleString()} refinement pts`,
        description: 'Main in-game currency',
        tooltip: 'Diamonds are mined in Minecore and will be used across future Kasparex Games.',
        accent: 'diamonds' as const,
        icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
        onClick: () => setTab('mining' as const),
      },
      {
        id: 'grid',
        label: 'GRID (redeemable)',
        value: Math.floor(state.gridRedeemableTotal).toLocaleString(),
        description: 'Ecosystem reward token',
        tooltip: 'Redeemable GRID is produced from refined diamond output under V1 rules.',
        accent: 'grid' as const,
        onClick: () => setTab('rewards' as const),
      },
      {
        id: 'grid_pending',
        label: 'GRID (pending)',
        value: pendingGrid.toLocaleString(),
        description: 'Unified deck view',
        tooltip: 'This value is shown in the global deck in other games. Minecore will connect later.',
        accent: 'grid' as const,
      },
    ],
    [state.diamondsBalance, state.refinementPointsTotal, state.gridRedeemableTotal]
  );

  return (
    <TooltipProvider>
      <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col space-y-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-base dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                <DiamondIcon className="h-4 w-4 text-sky-400" />
                Diamonds
              </span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{Math.floor(state.diamondsBalance).toLocaleString()}</span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Refinement {Math.floor(state.refinementPointsTotal).toLocaleString()} pts
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Mine diamonds, refine output, redeem GRID. See <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards &amp; Points</Link>.
            </p>
          </div>

          <GameTabs tabs={TABS} value={tab} onChange={setTab} />

          {tab === 'mining' && (
            <div className="space-y-6">
              {lastPaymentError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-800 dark:text-rose-200">
                  {lastPaymentError}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {state.plantSlots.map((slot) => (
                  <PlantSlotCard
                    key={slot.id}
                    slot={slot}
                    diamondsBalance={state.diamondsBalance}
                    onUnlock={() => void actions.unlockSlot(slot.index, slot.unlockCostKas)}
                    onStart={() => actions.startMining(slot.index)}
                    onExtract={() => actions.extract(slot.index)}
                    onTopUp={() => actions.topUpPower(slot.index, 1)}
                    onRepair={() => actions.repair(slot.index)}
                    onQuickSetup={() => {
                      actions.installMachine(slot.index, 'pulse-drill');
                      actions.installBattery(slot.index, 'energy-cell');
                      actions.installWorker(slot.index, 'worker');
                      actions.setBoost(slot.index, 'none');
                      actions.setModules(slot.index, []);
                    }}
                  />
                ))}

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Expansion</div>
                      <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">Add plant slot</div>
                      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        Cost {state.nextSlotCostKas.toLocaleString()} KAS
                      </div>
                    </div>
                    <Tooltip content="V1 mock action. This will wire into KAS payment later through the global payments SDK.">
                      <button
                        type="button"
                        onClick={() => void actions.addSlot(state.nextSlotCostKas)}
                        className="k-cta-games h-11 px-6 text-sm"
                      >
                        Add
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'fabrication' && <FabricationPanel state={state} onCraft={actions.craftRecipe} />}

          {tab === 'rewards' && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Redeem</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">V1: redeem refinement points into GRID redeemable.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => actions.redeemGrid(Math.floor(state.refinementPointsTotal))}
                  className="k-cta-games h-11 px-6 text-sm"
                >
                  Redeem all points
                </button>
                <button
                  type="button"
                  onClick={() => actions.refine(Math.min(100, Math.floor(state.diamondsBalance)))}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
                >
                  Refine 100 diamonds
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6 lg:col-span-4">
          <GameDeckPanel
            resources={resources}
            footer={<span>Minecore is the central loop. Timers persist across reloads.</span>}
            featured={_props.featuredImage ? { image: _props.featuredImage, tooltip: 'Minecore' } : undefined}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

