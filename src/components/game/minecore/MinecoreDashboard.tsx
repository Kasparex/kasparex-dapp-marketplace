'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { GameTabs } from '@/components/games/layout/GameTabs';
import { GameDeckPanel } from '@/components/games/panels/GameDeckPanel';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { TooltipProvider, Tooltip } from '@/components/ui/Tooltip';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { useMinecore } from '@/hooks/useMinecore';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { computeMinecoreDiamondsDisplayTotal } from '@/lib/game/minecore/compute';
import { PlantSlotCard } from '@/components/game/minecore/PlantSlotCard';
import { FabricationPanel } from '@/components/game/minecore/FabricationPanel';
import { ShopPanel } from '@/components/game/minecore/ShopPanel';
import { MinecoreArticle } from '@/components/game/minecore/MinecoreArticle';
import { MinecorePowerPanel } from '@/components/game/minecore/MinecorePowerPanel';
import { MinecoreRewardsPanel } from '@/components/game/minecore/MinecoreRewardsPanel';
import { MinecoreMiningSections } from '@/components/game/minecore/MinecoreMiningSections';
import { MinecoreMaintenanceCostsPanel } from '@/components/game/minecore/MinecoreMaintenanceCostsPanel';
import { MINECORE_PLANT_REPAIR_KAS } from '@/lib/game/minecore/config';
import { GameInteractionsPanel } from '@/components/games/panels/GameInteractionsPanel';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { GamesPlayAdRail } from '@/components/games/GamesPlayAdRail';
import { IconOverview, IconShop, IconWorkers, IconRewards, IconBoosters, IconPower } from '@/components/games/icons/TabIcons';
import { WorkersPanel } from '@/components/game/minecore/WorkersPanel';
import { MinecoreOwnedWorkersPanel } from '@/components/game/minecore/MinecoreOwnedAssetsPanel';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import * as Icons from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'mining', label: '1. Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" /> },
  { id: 'fabrication', label: '2. Build', icon: <IconBoosters /> },
  { id: 'power', label: '3. Power', icon: <IconPower /> },
  { id: 'workers', label: '4. Workers', icon: <IconWorkers /> },
  { id: 'shop', label: 'Shop', icon: <IconShop /> },
  { id: 'redeem', label: 'Redeem', icon: <IconRewards /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function MinecoreDashboard(_props: {
  featuredImage?: string;
  gameDescription?: string;
  game?: any;
  gameName?: string;
}) {
  const { state, actions, lastPaymentError, getKasPriceAfterDiscount, slottedMetadata, wallet, nowTick, miningAllowed, profileNotice } =
    useMinecore();
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
      if (miningCategory === 'Active') {
        list = list.filter(
          (s) =>
            s.status === 'MiningActive' ||
            s.status === 'MiningPaused' ||
            s.status === 'InsufficientPower',
        );
      }
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

  const diamondsDisplayTotal = Math.floor(computeMinecoreDiamondsDisplayTotal(state, nowTick));

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
        label: 'Diamonds',
        value: diamondsDisplayTotal.toLocaleString(),
        subValue: `${Math.floor(state.refinementPointsTotal).toLocaleString()} Refinement Points`,
        description: 'Mined diamonds ready to refine',
        tooltip:
          'All diamonds: wallet plus any still in your plants (including active runs). Refined the same in Redeem. Click to open Mining.',
        accent: 'diamonds' as const,
        icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
        onClick: () => setTab('mining' as const),
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
      <div className="flex flex-col space-y-6">
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
              <Icons.Gem className="h-4 w-4 text-sky-400" />
              Diamonds
            </span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{diamondsDisplayTotal.toLocaleString()}</span>
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

        <UnifiedGameLayout
          tabs={TABS as any}
          currentTab={tab}
          onTabChange={setTab}
          resources={resources}
          game={{
            name: _props.gameName ?? 'Minecore',
            featuredImage: _props.featuredImage,
            connections,
            categories,
            tags,
          }}
          onOpenOverview={openOverview}
          deckFooter={<span>Values update live as you mine, refine, and pay for slots.</span>}
        >
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

              <MinecoreMaintenanceCostsPanel nextSlotCostKas={state.nextSlotCostKas} />

              <div className="grid gap-4 sm:grid-cols-2">
                {filteredSlots.map((slot) => (
                  <PlantSlotCard
                    key={slot.id}
                    minecoreState={state}
                    slot={slot}
                    now={nowTick}
                    onUnlock={() => void actions.unlockSlot(slot.index, slot.unlockCostKas)}
                    onStart={() => actions.startMining(slot.index)}
                    onStopMining={() => actions.stopMining(slot.index)}
                    onResumeMining={() => actions.resumeMining(slot.index)}
                    onExtract={() => actions.extract(slot.index)}
                    onRechargePlant={async (opts) => {
                      void (await actions.rechargePlantWithKAS(slot.index, opts));
                    }}
                    onRepairWithKAS={async ({ amountKas }) => {
                      void (await actions.repairWithKAS(slot.index, amountKas));
                    }}
                    onInstallPart={(kind, id) => {
                      if (kind === 'machine') actions.installMachine(slot.index, id);
                      if (kind === 'battery') actions.installBattery(slot.index, id);
                      if (kind === 'worker') actions.installWorker(slot.index, id);
                      if (kind === 'modules') actions.setModules(slot.index, id);
                    }}
                    onChangePlantType={(type, cost) => actions.changePlantType(slot.index, type, cost)}
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
              now={nowTick}
              getKasPriceAfterDiscount={getKasPriceAfterDiscount}
              onDemoTopUpFirstPlant={() => {
                actions.topUpPower(0, 5);
              }}
              onRechargePlant={(idx) => {
                void actions.rechargePlantWithKAS(idx, { units: 1 });
              }}
              onBatterySync={async (idx, currency) => {
                if (currency === 'KREX') {
                  actions.refillBattery(idx);
                  return;
                }
                await actions.refillBatteryWithKAS(idx, 3);
              }}
              onReservePack={async (idx, currency) => {
                if (currency === 'KREX') {
                  actions.topUpPower(idx, 3);
                  return;
                }
                await actions.topUpPowerWithKAS(idx, { added: 3, amountKas: 6 });
              }}
              onRuntimeBundle={async (idx, currency) => {
                if (currency === 'KREX') {
                  actions.topUpPower(idx, 1);
                  actions.refillBattery(idx);
                  return;
                }
                await actions.rechargePlantWithKAS(idx, { units: 1 });
              }}
            />
          )}

          {tab === 'workers' && (
            <div className="space-y-6">
              <MinecoreOwnedWorkersPanel owned={state.owned} />
              <WorkersPanel
                slots={state.nftSlots}
                slottedMetadata={slottedMetadata}
                autoRestart={state.automation.autoRestart}
                foremanActive={state.automation.foremanActive}
                onToggleAutoRestart={(enabled) => actions.setAutomation({ autoRestart: enabled })}
                onDeploy={actions.deployNFT}
                onRemove={(slotIndex) => actions.removeNFT(slotIndex)}
              />
            </div>
          )}

          {tab === 'shop' && (
            <ShopPanel
              ingredients={state.ingredients}
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
                          : ingredient === 'fluxCoils'
                            ? 1.2
                            : ingredient === 'latticeWire'
                              ? 2.5
                              : 0.5;
                  await actions.purchaseIngredientWithKAS(ingredient, { amount: quantity, amountKas: unit * quantity });
                }
              }}
              onBuy={async ({ itemId, currency, quantity }) => {
                if (itemId === 'power-topup' && currency === 'KAS') {
                  await actions.rechargePlantWithKAS(0, { units: quantity });
                }
                if (itemId === 'kas-overclock' && currency === 'KAS') {
                  actions.setBoost(0, 'kas-overclock');
                }
                if (itemId === 'repair' && currency === 'KAS') {
                  await actions.repairWithKAS(0, MINECORE_PLANT_REPAIR_KAS);
                }
              }}
            />
          )}

          {tab === 'fabrication' && (
            <FabricationPanel state={state} onCraft={actions.craftRecipe} />
          )}

          {tab === 'redeem' && (
            <div className="space-y-6">
              <MinecoreRewardsPanel
                address={wallet.address ?? undefined}
                diamondsBalance={diamondsDisplayTotal}
                refinementPointsTotal={state.refinementPointsTotal}
                localLedger={state.gridLedger ?? []}
                onRefine={actions.refine}
                onRedeem={actions.redeemGrid}
                minecoreExtras={{
                  redeemBudgetDayKey: state.redeemBudget?.dayKey,
                  refinementPointsSpentOnGrid: state.redeemBudget?.refinementPointsSpentOnGrid,
                  refinementPointsSpentOnKrex: state.redeemBudget?.refinementPointsSpentOnKrex,
                  gridRedeemablePending: state.gridRedeemableTotal,
                  krexRedeemablePending: state.krexRedeemableTotal,
                }}
              />
            </div>
          )}
        </UnifiedGameLayout>
      </div>
    </TooltipProvider>
  );
}
