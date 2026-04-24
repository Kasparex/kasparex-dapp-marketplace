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
import { InventoryPanel } from '@/components/game/minecore/InventoryPanel';
import { ShopPanel } from '@/components/game/minecore/ShopPanel';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { GameInteractionsPanel } from '@/components/games/panels/GameInteractionsPanel';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { IconOverview, IconShop, IconWorkers, IconRewards, IconBoosters, IconSignal } from '@/components/games/icons/TabIcons';
import { WorkersPanel } from '@/components/game/minecore/WorkersPanel';
import { MINECORE_BATTERIES } from '@/lib/game/minecore/config';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'mining', label: 'Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" /> },
  { id: 'workers', label: 'Workers', icon: <IconWorkers /> },
  { id: 'inventory', label: 'Inventory', icon: <IconSignal /> },
  { id: 'shop', label: 'Shop', icon: <IconShop /> },
  { id: 'fabrication', label: 'Build', icon: <IconBoosters /> },
  { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function MinecoreDashboard(_props: {
  featuredImage?: string;
  loreStory?: string;
  gameDescription?: string;
  game?: any;
  gameName?: string;
}) {
  const { state, actions, lastPaymentError, getKasPriceAfterDiscount } = useMinecore();
  const [tab, setTab] = useState<TabId>('overview');

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

  const connections = (_props.game?.connections ?? []) as Array<{ toSlug?: string; toHref?: string; title: string; punch: string; requirement?: string }>;
  const categories = (_props.game?.categories ?? []) as string[];
  const tags = (_props.game?.tags ?? []) as string[];

  const miningStats = useMemo(() => {
    const now = Date.now();
    const active = state.plantSlots.filter((p) => p.cycle && now < p.cycle.endAtMs);
    const flow = active.reduce((acc, p) => acc + (p.cycle ? p.cycle.expectedDiamonds / Math.max(1, p.cycle.durationMs) : 0), 0);

    const cap = state.plantSlots.reduce((acc, p) => {
      if (!p.unlocked || !p.setup.batteryId) return acc;
      const b = MINECORE_BATTERIES[p.setup.batteryId];
      return acc + (b?.powerCapacity ?? 0);
    }, 0);
    const used = active.length;
    const efficiency = used <= cap || used === 0 ? 1 : cap / used;

    return { flowPerSecond: flow, powerUsed: used, powerCap: cap, powerEfficiency: efficiency };
  }, [state.plantSlots]);

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
              <span className="inline-flex items-center gap-2 font-bold tabular-nums text-amber-600 dark:text-amber-400">
                <DiamondIcon className="h-4 w-4 text-sky-400" />
                {Math.floor(state.diamondsBalance).toLocaleString()}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Refinement {Math.floor(state.refinementPointsTotal).toLocaleString()} pts
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Mine diamonds, refine output, redeem GRID. See <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">Rewards &amp; Points</Link>.
            </p>
          </div>

          <GameTabs tabs={TABS} value={tab} onChange={setTab} />

          {tab === 'overview' && (
            <div className="space-y-6">
              <GameOverviewSections
                gameName={_props.gameName ?? 'Minecore'}
                description={_props.gameDescription}
                loreStory={_props.loreStory}
                featuredImage={_props.featuredImage}
                flow={[
                  'Craft parts and modules from ingredients.',
                  'Unlock a plant slot with KAS and install machine, power, workers, and modules.',
                  'Start a mining cycle, then extract diamonds when complete.',
                  'Refine diamonds into points, then redeem output into GRID (V1 rules).',
                  'Expand slots and upgrade parts to grow your mining complex.',
                ]}
              />
            </div>
          )}

          {tab === 'mining' && (
            <div className="space-y-6">
              {lastPaymentError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-800 dark:text-rose-200">
                  {lastPaymentError}
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Flow rate</div>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{miningStats.flowPerSecond.toFixed(3)} D/s</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Power</div>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {miningStats.powerUsed.toFixed(0)} / {miningStats.powerCap.toFixed(0)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Efficiency {(miningStats.powerEfficiency * 100).toFixed(0)}%</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Automation</div>
                  <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {state.automation.autoRestart ? 'Auto-restart on' : 'Auto-restart off'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Foreman active {state.automation.foremanActive ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {state.plantSlots.map((slot) => (
                  <PlantSlotCard
                    key={slot.id}
                    slot={slot}
                    diamondsBalance={state.diamondsBalance}
                    onUnlock={() => void actions.unlockSlot(slot.index, slot.unlockCostKas)}
                    onStart={() => actions.startMining(slot.index)}
                    onExtract={() => actions.extract(slot.index)}
                    onTopUpWithKAS={async ({ amountKas, added }) => { void (await actions.topUpPowerWithKAS(slot.index, { added, amountKas })); }}
                    onRepairWithKAS={async ({ amountKas }) => { void (await actions.repairWithKAS(slot.index, amountKas)); }}
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
                      <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Power Plant</div>
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

          {tab === 'workers' && (
            <WorkersPanel
              slots={state.nftSlots}
              autoRestart={state.automation.autoRestart}
              foremanActive={state.automation.foremanActive}
              onToggleAutoRestart={(enabled) => actions.setAutomation({ autoRestart: enabled })}
              onDeploy={actions.deployNFT}
              onRemove={(slotIndex) => actions.removeNFT(slotIndex)}
            />
          )}

          {tab === 'inventory' && <InventoryPanel state={state} />}

          {tab === 'shop' && (
            <ShopPanel
              getKasPriceAfterDiscount={getKasPriceAfterDiscount}
              onBuyIngredient={async ({ ingredient, currency, quantity }) => {
                if (currency === 'KAS') {
                  const unit =
                    ingredient === 'energyCells'
                      ? 3
                      : ingredient === 'alloyPlates'
                        ? 2
                        : ingredient === 'circuitMesh'
                          ? 1.5
                          : 0.5;
                  await actions.purchaseIngredientWithKAS(ingredient, { amount: quantity, amountKas: unit * quantity });
                }
              }}
              onBuy={async ({ itemId, currency, quantity }) => {
                if (itemId === 'power-topup' && currency === 'KAS') {
                  await actions.topUpPowerWithKAS(0, { added: quantity, amountKas: 1 * quantity });
                }
                if (itemId === 'kas-overclock' && currency === 'KAS') {
                  // V1: treat as boost selection to keep state simple.
                  actions.setBoost(0, 'kas-overclock');
                }
                if (itemId === 'repair' && currency === 'KAS') {
                  await actions.repairWithKAS(0, 2);
                }
              }}
            />
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

          <GameInteractionsPanel interactions={connections} />

          <GamePurchasesPanel>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Slot unlocks and expansions are paid with KAS. Boost items are V1 stubs and will expand with KREX and GRID utility.
            </div>
          </GamePurchasesPanel>

          <GameMetadataPanel categories={categories} tags={tags} />
        </div>
      </div>
    </TooltipProvider>
  );
}

