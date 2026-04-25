'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GameTabs } from '@/components/games/layout/GameTabs';
import { GameDeckPanel } from '@/components/games/panels/GameDeckPanel';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { TooltipProvider, Tooltip } from '@/components/ui/Tooltip';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { useMinecore } from '@/hooks/useMinecore';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { computeMinecoreDiamondsDisplayTotal } from '@/lib/game/minecore/compute';
import { PlantSlotCard } from '@/components/game/minecore/PlantSlotCard';
import { FabricationPanel } from '@/components/game/minecore/FabricationPanel';
import { InventoryPanel } from '@/components/game/minecore/InventoryPanel';
import { ShopPanel } from '@/components/game/minecore/ShopPanel';
import { MinecoreArticle } from '@/components/game/minecore/MinecoreArticle';
import { MinecorePowerPanel } from '@/components/game/minecore/MinecorePowerPanel';
import { MinecoreRewardsPanel } from '@/components/game/minecore/MinecoreRewardsPanel';
import { MinecoreMiningSections } from '@/components/game/minecore/MinecoreMiningSections';
import { GameInteractionsPanel } from '@/components/games/panels/GameInteractionsPanel';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { GamesPlayAdRail } from '@/components/games/GamesPlayAdRail';
import { IconOverview, IconShop, IconWorkers, IconRewards, IconBoosters, IconSignal, IconPower } from '@/components/games/icons/TabIcons';
import { WorkersPanel } from '@/components/game/minecore/WorkersPanel';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'mining', label: 'Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" /> },
  { id: 'power', label: 'Power', icon: <IconPower /> },
  { id: 'workers', label: 'Workers', icon: <IconWorkers /> },
  { id: 'inventory', label: 'Inventory', icon: <IconSignal /> },
  { id: 'shop', label: 'Shop', icon: <IconShop /> },
  { id: 'fabrication', label: 'Build', icon: <IconBoosters /> },
  { id: 'redeem', label: 'Redeem', icon: <IconRewards /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function MinecoreDashboard(_props: {
  featuredImage?: string;
  gameDescription?: string;
  game?: any;
  gameName?: string;
}) {
  const { state, actions, lastPaymentError, getKasPriceAfterDiscount, slottedMetadata, wallet } = useMinecore();
  const { balanceInKas, isLoading: kasBalanceHookLoading } = useKaspaBalance();
  const { l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();
  const [tab, setTab] = useState<TabId>('overview');
  const [krexWizardOpen, setKrexWizardOpen] = useState(false);
  // Using a simplified mock/hook call for GRID token
  // If useGRIDToken takes address, we can pass null to mock for now until integrated.
  // Actually, we'll just mock it as 0 to avoid breaking since we don't have the contract address injected here easily.
  const gridL1Balance = 0;

  const [miningSearch, setMiningSearch] = useState('');
  const [miningCategory, setMiningCategory] = useState('all');
  const [miningSort, setMiningSort] = useState('recommended');

  const filteredSlots = useMemo(() => {
    let list = [...state.plantSlots];
    if (miningSearch) {
      const q = miningSearch.toLowerCase();
      list = list.filter(slot => 
        slot.setup.machineId?.toLowerCase().includes(q) || 
        slot.id.toLowerCase().includes(q) ||
        (slot.index + 1).toString().includes(q)
      );
    }
    if (miningCategory !== 'all') {
      if (miningCategory === 'Unlocked') list = list.filter(s => s.unlocked);
      if (miningCategory === 'Locked') list = list.filter(s => !s.unlocked);
      if (miningCategory === 'Active') list = list.filter(s => s.status === 'MiningActive');
    }
    if (miningSort === 'price_asc') {
      list.sort((a, b) => a.unlockCostKas - b.unlockCostKas);
    } else if (miningSort === 'price_desc') {
      list.sort((a, b) => b.unlockCostKas - a.unlockCostKas);
    }
    return list;
  }, [state.plantSlots, miningSearch, miningCategory, miningSort]);

  const canPayWithL1 =
    Boolean(wallet.isConnected) && (wallet.provider === 'kasware' || wallet.provider === 'kastle');
  const kasValid = typeof balanceInKas === 'number' && !Number.isNaN(balanceInKas);
  const kasBalanceNum = kasValid ? balanceInKas : 0;
  const kasBalanceLoading = canPayWithL1 && kasBalanceHookLoading && balanceInKas === null;

  const diamondsDisplayTotal = Math.floor(computeMinecoreDiamondsDisplayTotal(state));

  const openOverview = () => {
    setTab('overview');
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // ignore
    }
  };

  const resources = useMemo(
    () => [
      {
        id: 'diamonds',
        label: 'Reward Weight',
        value: (diamondsDisplayTotal + Math.floor(state.refinementPointsTotal)).toLocaleString(),
        subValue: `${diamondsDisplayTotal.toLocaleString()} Diamonds + ${Math.floor(state.refinementPointsTotal).toLocaleString()} Points`,
        description: 'Combined reward potential',
        tooltip:
          'Your total reward weight: Diamonds in bag plus earned Refinement Points. Click to open Mining.',
        accent: 'diamonds' as const,
        icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
        onClick: () => setTab('mining' as const),
      },
      {
        id: 'points_redeemable',
        label: 'Points (redeemable)',
        value: Math.floor(state.gridRedeemableTotal).toLocaleString(),
        description: 'Reward points',
        tooltip: 'Redeemable Points produced from refinement under V1 rules. Click to open Redeem.',
        accent: 'purple' as const, // Different color for points
        onClick: () => setTab('redeem' as const),
      },
      {
        id: 'grid_token',
        label: 'GRID',
        value: gridL1Balance.toLocaleString(),
        description: 'Reward token',
        tooltip: 'Your actual GRID token balance.',
        accent: 'grid' as const,
        onClick: () => setTab('redeem' as const),
      },
      {
        id: 'krex',
        label: 'KREX',
        value: krexL1Balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
        description: 'Utility and power token',
        tooltip: `Your KREX balance on L1. Tier ${krexTier} gives KAS-only shop discounts. Click to open the buy KREX wizard.`,
        accent: 'krex' as const,
        onClick: () => setKrexWizardOpen(true),
      },
      {
        id: 'kas',
        label: 'KAS',
        value: (canPayWithL1 && kasBalanceLoading ? 0 : kasBalanceNum).toLocaleString(undefined, { maximumFractionDigits: 4 }),
        description: 'Main fuel currency',
        tooltip: 'Your Kaspa L1 wallet balance (KasWare/Kastle). Used for slot unlocks, shop, and power top-ups. Click to open Shop.',
        accent: 'kas' as const,
        onClick: () => setTab('shop' as const),
      },
    ],
    [
      diamondsDisplayTotal,
      state.refinementPointsTotal,
      state.gridRedeemableTotal,
      krexL1Balance,
      krexTier,
      canPayWithL1,
      kasBalanceLoading,
      kasBalanceNum,
      gridL1Balance,
    ]
  );

  const connections = (_props.game?.connections ?? []) as Array<{ toSlug?: string; toHref?: string; title: string; punch: string; requirement?: string }>;
  const categories = (_props.game?.categories ?? []) as string[];
  const tags = (_props.game?.tags ?? []) as string[];

  return (
    <TooltipProvider>
      <KREXBuyWizard isOpen={krexWizardOpen} onClose={() => setKrexWizardOpen(false)} />
      <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col space-y-6 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-base dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-center gap-6">
              <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">KREX (L1)</span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {krexL1Balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} KREX
              </span>
              <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">KAS</span>
              <span className="min-w-[5rem] font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {canPayWithL1 && kasBalanceLoading ? '0' : kasBalanceNum.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}{' '}
                KAS
              </span>
              <span className="inline-flex items-center gap-2 font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                <DiamondIcon className="h-4 w-4 text-sky-400" />
                Reward Weight
              </span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{(diamondsDisplayTotal + Math.floor(state.refinementPointsTotal)).toLocaleString()}</span>
              <span className="rounded-full border border-zinc-300 bg-zinc-200 px-2 py-0.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                {krexTier}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Earn on L1 · claim GRID on L2 via{' '}
              <Link href="/rewards-and-points" className="font-semibold text-emerald-600 dark:text-emerald-400 underline">
                Rewards &amp; Points
              </Link>
            </p>
          </div>

          <GameTabs tabs={TABS} value={tab} onChange={setTab} />

          {tab === 'overview' && (
            <div className="space-y-6">
              <GamePanelCard title={_props.gameName ?? 'Minecore'} hint={_props.gameDescription}>
                <MinecoreArticle featuredImage={_props.featuredImage} gameName={_props.gameName} hint={_props.gameDescription} />
              </GamePanelCard>
              <GamePanelCard title="Game flow" hint="Core loop at a glance.">
                <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Craft parts and modules from ingredients.</li>
                  <li>Unlock a plant slot with KAS and install machine, power, workers, and modules.</li>
                  <li>Start a mining cycle, then extract diamonds when complete.</li>
                  <li>Refine diamonds into points, then redeem output into GRID (V1 rules).</li>
                  <li>Expand slots and upgrade parts to grow your mining complex.</li>
                </ul>
              </GamePanelCard>
            </div>
          )}

          {tab === 'mining' && (
            <div className="space-y-6">
              {lastPaymentError ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-800 dark:text-rose-200">
                  {lastPaymentError}
                </div>
              ) : null}

              <CardsFilterBar
                searchQuery={miningSearch}
                onSearchChange={setMiningSearch}
                category={miningCategory}
                onCategoryChange={setMiningCategory}
                categories={['Unlocked', 'Locked', 'Active']}
                sortBy={miningSort}
                onSortChange={setMiningSort}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {filteredSlots.map((slot) => (
                  <PlantSlotCard
                    key={slot.id}
                    minecoreState={state}
                    slot={slot}
                    onUnlock={() => void actions.unlockSlot(slot.index, slot.unlockCostKas)}
                    onStart={() => actions.startMining(slot.index)}
                    onExtract={() => actions.extract(slot.index)}
                    onTopUpWithKAS={async ({ amountKas, added }) => {
                      void (await actions.topUpPowerWithKAS(slot.index, { added, amountKas }));
                    }}
                    onRepairWithKAS={async ({ amountKas }) => {
                      void (await actions.repairWithKAS(slot.index, amountKas));
                    }}
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
                      <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Mining Plant</div>
                      <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Cost {state.nextSlotCostKas.toLocaleString()} KAS</div>
                    </div>
                    <Tooltip content="V1 mock action. This will wire into KAS payment later through the global payments SDK.">
                      <button type="button" onClick={() => void actions.addSlot(state.nextSlotCostKas)} className="k-cta-games h-11 px-6 text-sm">
                        Add
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <MinecoreMiningSections state={state} />
            </div>
          )}

          {tab === 'power' && (
            <MinecorePowerPanel
              state={state}
              onDemoTopUpFirstPlant={() => {
                actions.topUpPower(0, 5);
              }}
            />
          )}

          {tab === 'workers' && (
            <WorkersPanel
              slots={state.nftSlots}
              slottedMetadata={slottedMetadata}
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
                  actions.setBoost(0, 'kas-overclock');
                }
                if (itemId === 'repair' && currency === 'KAS') {
                  await actions.repairWithKAS(0, 2);
                }
              }}
            />
          )}

          {tab === 'fabrication' && <FabricationPanel state={state} onCraft={actions.craftRecipe} />}

          {tab === 'redeem' && (
            <div className="space-y-6">
              <MinecoreRewardsPanel
                address={wallet.address ?? undefined}
                diamondsBalance={state.diamondsBalance}
                refinementPointsTotal={state.refinementPointsTotal}
                localLedger={state.gridLedger ?? []}
                onRefine={actions.refine}
                onRedeem={actions.redeemGrid}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6 lg:col-span-4">
          <GameDeckPanel
            resources={resources}
            footer={<span>Values update live as you mine, refine, and pay for slots.</span>}
            featured={
              _props.featuredImage
                ? { image: _props.featuredImage, onOpenOverview: openOverview, tooltip: 'Click to open game overview' }
                : undefined
            }
          />

          <GameInteractionsPanel interactions={connections} />

          <GamePurchasesPanel>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Slot unlocks and expansions are paid with KAS. Boost items are V1 stubs and will expand with KREX and GRID utility.
            </div>
          </GamePurchasesPanel>

          <GameMetadataPanel categories={categories} tags={tags} />

          <GamesPlayAdRail />
        </div>
      </div>
    </TooltipProvider>
  );
}
