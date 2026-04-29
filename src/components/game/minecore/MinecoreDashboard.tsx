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
import {
  computeMinecoreDiamondsDisplayTotal,
  computeMinecoreRollingDailyCapDeckTotals,
  minecoreAutoRestartInfrastructureActive,
} from '@/lib/game/minecore/compute';
import { minecoreUtcDayKey } from '@/lib/game/minecore/plant-economy';
import { getPlantBatterySlotCount } from '@/lib/game/minecore/battery-utils';
import { PlantSlotCard } from '@/components/game/minecore/PlantSlotCard';
import { FabricationPanel } from '@/components/game/minecore/FabricationPanel';
import { ShopPanel } from '@/components/game/minecore/ShopPanel';
import { MinecoreArticle } from '@/components/game/minecore/MinecoreArticle';
import { MinecorePowerPanel } from '@/components/game/minecore/MinecorePowerPanel';
import { MinecoreRewardsPanel } from '@/components/game/minecore/MinecoreRewardsPanel';
import { MinecoreMiningSections } from '@/components/game/minecore/MinecoreMiningSections';
import { MinecoreMaintenanceCostsPanel } from '@/components/game/minecore/MinecoreMaintenanceCostsPanel';
import { MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS, MINECORE_PLANT_REPAIR_KAS, MINECORE_GRID_PER_REFINEMENT_POINT, MINECORE_DAILY_GRID_POINTS_CAP, MINECORE_REFINE_POINTS_PER_DIAMOND } from '@/lib/game/minecore/config';
import { CALC_INGREDIENT_KAS } from '@/lib/game/minecore/calculator';
import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
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
  const {
    state,
    actions,
    lastPaymentError,
    lastSetupError,
    dismissLastPaymentError,
    dismissLastSetupError,
    getKasPriceAfterDiscount,
    slottedMetadata,
    minecoreComputeContext,
    wallet,
    nowTick,
    miningAllowed,
    profileNotice,
    dismissProfileNotice,
  } = useMinecore();
  const { balanceInKas, isLoading: kasBalanceHookLoading } = useKaspaBalance();
  const { l1Balance: krexL1Balance, tier: krexTier } = useKREXBalance();
  const krexDiscountPct = KREX_TIER_SHOP_DISCOUNT_PCT[krexTier as keyof typeof KREX_TIER_SHOP_DISCOUNT_PCT] ?? 0;
  const [tab, setTab] = useState<TabId>('overview');
  const [krexWizardOpen, setKrexWizardOpen] = useState(false);
  // Using a simplified mock/hook call for GRID token
  // If useGRIDToken takes address, we can pass null to mock for now until integrated.
  // Actually, we'll just mock it as 0 to avoid breaking since we don't have the contract address injected here easily.
  const gridL1Balance = 0;

  const [miningSearch, setMiningSearch] = useState('');
  const [miningCategory, setMiningCategory] = useState('all');
  const [miningSort, setMiningSort] = useState('recommended');

  /** Each row carries the real `plantSlots` array index so InstallPart targets the same slot as the UI (no findIndex/id drift). */
  const filteredMiningSlots = useMemo(() => {
    let entries = state.plantSlots.map((slot, slotIndex) => ({ slot, slotIndex }));
    if (miningSearch) {
      const q = miningSearch.toLowerCase();
      entries = entries.filter(
        ({ slot }) =>
          slot.setup.machineId?.toLowerCase().includes(q) ||
          slot.id.toLowerCase().includes(q) ||
          (slot.index + 1).toString().includes(q),
      );
    }
    if (miningCategory !== 'all') {
      if (miningCategory === 'Unlocked') entries = entries.filter(({ slot }) => slot.unlocked);
      if (miningCategory === 'Locked') entries = entries.filter(({ slot }) => !slot.unlocked);
      if (miningCategory === 'Active') {
        entries = entries.filter(
          ({ slot }) =>
            slot.status === 'MiningActive' ||
            slot.status === 'MiningPaused' ||
            slot.status === 'InsufficientPower' ||
            slot.status === 'CreditingReady' ||
            slot.status === 'BatteryEmpty',
        );
      }
    }
    if (miningSort === 'price_asc') {
      entries.sort((a, b) => a.slot.unlockCostKas - b.slot.unlockCostKas);
    } else if (miningSort === 'price_desc') {
      entries.sort((a, b) => b.slot.unlockCostKas - a.slot.unlockCostKas);
    }
    return entries;
  }, [state.plantSlots, miningSearch, miningCategory, miningSort]);

  const canPayWithL1 =
    Boolean(wallet.isConnected) && (wallet.provider === 'kasware' || wallet.provider === 'kastle');
  const kasValid = typeof balanceInKas === 'number' && !Number.isNaN(balanceInKas);
  const kasBalanceNum = kasValid ? balanceInKas : 0;
  const kasBalanceLoading = canPayWithL1 && kasBalanceHookLoading && balanceInKas === null;

  const diamondsDisplayTotal = Math.floor(
    computeMinecoreDiamondsDisplayTotal(state, nowTick, minecoreComputeContext),
  );
  const deckRollingCaps = useMemo(
    () => computeMinecoreRollingDailyCapDeckTotals(state, nowTick, minecoreComputeContext),
    [state, nowTick, minecoreComputeContext],
  );
  const autoRestartInfrastructureActive = useMemo(() => minecoreAutoRestartInfrastructureActive(state), [state]);

  const gridRedeemEstimateToday = useMemo(() => {
    const today = minecoreUtcDayKey(nowTick);
    const rb = state.redeemBudget;
    const spent = rb?.dayKey === today ? rb.refinementPointsSpentOnGrid : 0;
    const ptsLeft = Math.max(0, MINECORE_DAILY_GRID_POINTS_CAP - spent);
    const ptsFromDiamonds = Math.floor(diamondsDisplayTotal * MINECORE_REFINE_POINTS_PER_DIAMOND);
    const pts = Math.min(ptsFromDiamonds, ptsLeft);
    return Math.floor(pts * MINECORE_GRID_PER_REFINEMENT_POINT);
  }, [diamondsDisplayTotal, state.redeemBudget, nowTick]);

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
        value: (
          <span className="flex w-full min-w-0 flex-col items-end gap-0.5 tabular-nums">
            <span className="flex items-baseline justify-end gap-1">
              <span className="text-xl font-black leading-none text-amber-400 dark:text-amber-300">
                {diamondsDisplayTotal.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500">/</span>
              <span className="text-xl font-black leading-none text-amber-400 dark:text-amber-300">
                {Math.max(0, Math.floor(deckRollingCaps.capSum)).toLocaleString()}
              </span>
            </span>
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              ~
              <span className="font-black text-amber-500 dark:text-amber-400">
                {gridRedeemEstimateToday.toLocaleString()}
              </span>{' '}
              GRID today (est.)
            </span>
          </span>
        ),
        description: 'In-game currency',
        tooltip: 'Diamonds you earn in plants; refine them into redeem points. Opens Redeem.',
        accent: 'diamonds' as const,
        icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
        onClick: () => setTab('redeem' as const),
      },
      {
        id: 'redeem_points',
        label: 'Redeem points',
        value: Math.floor(state.refinementPointsTotal).toLocaleString(),
        subValue: (
          <>
            ~
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {Math.floor(state.refinementPointsTotal * MINECORE_GRID_PER_REFINEMENT_POINT).toLocaleString()}
            </span>{' '}
            GRID total
          </>
        ),
        description: 'From refining diamonds',
        tooltip: 'Points from refining. Trade for GRID on Redeem (daily cap).',
        accent: 'purple' as const,
        onClick: () => setTab('redeem' as const),
      },
      {
        id: 'grid_token',
        label: 'GRID',
        value: gridL1Balance.toLocaleString(),
        description: 'Wallet balance',
        tooltip: 'GRID tokens on-chain (L2).',
        accent: 'grid' as const,
        onClick: () => setTab('redeem' as const),
      },
      {
        id: 'krex',
        label: 'KREX',
        value: krexL1Balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }),
        description: 'Utility token',
        tooltip: `KREX on L1 — tier ${krexTier} lowers some KAS shop prices.`,
        accent: 'krex' as const,
        onClick: () => setKrexWizardOpen(true),
      },
      {
        id: 'kas',
        label: 'KAS',
        value: (canPayWithL1 && kasBalanceLoading ? 0 : kasBalanceNum).toLocaleString(undefined, { maximumFractionDigits: 4 }),
        description: 'Wallet balance',
        tooltip: 'KAS on L1 — unlocks, shop, plant refill.',
        accent: 'kas' as const,
        onClick: () => setTab('shop' as const),
      },
    ],
    [
      diamondsDisplayTotal,
      gridRedeemEstimateToday,
      deckRollingCaps.capSum,
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

  const tabAlerts =
    profileNotice || lastPaymentError || lastSetupError ? (
      <div className="space-y-3">
        {profileNotice ? (
          <div className="relative rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 pr-11 text-sm font-semibold text-sky-900 dark:text-sky-100">
            <button
              type="button"
              onClick={() => dismissProfileNotice()}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 text-sky-700 transition-colors hover:bg-sky-500/20 dark:text-sky-200 dark:hover:bg-sky-500/15"
              aria-label="Dismiss notice"
            >
              <Icons.X className="h-4 w-4" />
            </button>
            {profileNotice}
          </div>
        ) : null}
        {lastPaymentError ? (
          <div className="relative rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 pr-11 text-sm font-semibold text-rose-800 dark:text-rose-200">
            <button
              type="button"
              onClick={() => dismissLastPaymentError()}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 text-rose-700 transition-colors hover:bg-rose-500/20 dark:text-rose-200 dark:hover:bg-rose-500/15"
              aria-label="Dismiss error"
            >
              <Icons.X className="h-4 w-4" />
            </button>
            {lastPaymentError}
          </div>
        ) : null}
        {lastSetupError ? (
          <div className="relative rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 pr-11 text-sm font-semibold text-amber-950 dark:text-amber-100">
            <button
              type="button"
              onClick={() => dismissLastSetupError()}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/30 text-amber-900 transition-colors hover:bg-amber-500/20 dark:text-amber-100 dark:hover:bg-amber-500/15"
              aria-label="Dismiss setup message"
            >
              <Icons.X className="h-4 w-4" />
            </button>
            {lastSetupError}
          </div>
        ) : null}
      </div>
    ) : null;

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
            <span className="inline-flex items-center gap-1 font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
              <Icons.Gem className="h-4 w-4 text-sky-400" />
              Deck (mined / cap)
            </span>
            <span className="inline-flex items-baseline gap-1 font-bold tabular-nums text-amber-500 dark:text-amber-400">
              <span>{Math.floor(deckRollingCaps.minedSum).toLocaleString()}</span>
              <span className="text-zinc-500 dark:text-zinc-400">/</span>
              <span>{Math.floor(deckRollingCaps.capSum).toLocaleString()}</span>
            </span>
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
          tabAlerts={tabAlerts}
        >
          {tab === 'overview' && (
            <div className="space-y-6">
              <MinecoreArticle featuredImage={_props.featuredImage} gameName={_props.gameName} hint={_props.gameDescription} />
              <GamePanelCard title="Game flow" hint="Core loop at a glance.">
                <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>Craft parts and modules from ingredients.</li>
                  <li>Activate a plant slot with KAS and install machine, power, workers, and modules.</li>
                  <li>Start a run; when the cycle or battery ends, diamonds credit automatically to your refineable balance.</li>
                  <li>Refine diamonds into points, then redeem output into GRID (V1 rules).</li>
                  <li>Expand slots and upgrade parts to grow your mining complex.</li>
                </ul>
              </GamePanelCard>
            </div>
          )}

          {tab === 'mining' && (
            <div className="space-y-6">
              <MinecoreMaintenanceCostsPanel
                nextSlotCostKas={state.nextSlotCostKas}
                getKasPriceAfterDiscount={getKasPriceAfterDiscount}
                krexTier={krexTier}
                krexDiscountPct={krexDiscountPct}
                onOpenKrexWizard={() => setKrexWizardOpen(true)}
              />

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
                {filteredMiningSlots.map(({ slot, slotIndex }) => (
                  <PlantSlotCard
                    key={`plant-slot-${slotIndex}`}
                    minecoreState={state}
                    minecoreComputeContext={minecoreComputeContext}
                    slot={slot}
                    slotArrayIndex={slotIndex}
                    now={nowTick}
                    onUnlock={() => void actions.unlockSlot(slotIndex, slot.unlockCostKas)}
                    onStart={() => actions.startMining(slotIndex)}
                    onStopMining={() => actions.stopMining(slotIndex)}
                    onResumeMining={() => actions.resumeMining(slotIndex)}
                    onExtract={() => actions.extract(slotIndex)}
                    onRechargePlant={async (opts) => {
                      void (await actions.rechargePlantWithKAS(slotIndex, opts));
                    }}
                    onRepairWithKAS={async ({ amountKas }) => {
                      void (await actions.repairWithKAS(slotIndex, amountKas));
                    }}
                    onInstallPart={(kind, id, batterySlotIndex, minerPosition) => {
                      const batteryIdx = batterySlotIndex ?? 0;
                      switch (kind) {
                        case 'machine':
                          actions.installMachine(slotIndex, id);
                          break;
                        case 'battery':
                          actions.installBattery(slotIndex, id, batteryIdx);
                          break;
                        case 'crewWorkerNftDeck':
                          actions.assignPlantWorkerNftDeck(slotIndex, id as number | null, minerPosition ?? 0);
                          break;
                        case 'modules':
                          actions.setModules(slotIndex, id);
                          break;
                        default:
                          break;
                      }
                    }}
                    onChangePlantType={(type, cost) => actions.changePlantType(slotIndex, type, cost)}
                  />
                ))}

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Expansion</div>
                      <div className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">Add Mining Plant</div>
                      <Tooltip
                        content={`List ${state.nextSlotCostKas.toLocaleString()} KAS. ${krexTier}${
                          krexDiscountPct > 0
                            ? ` tier: ${krexDiscountPct}% off in-game KAS.`
                            : ' - no tier discount on KAS.'
                        }`}
                      >
                        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                          {krexDiscountPct > 0 ? (
                            <span className="font-semibold tabular-nums">
                              <span className="text-zinc-400 line-through decoration-zinc-400/80">
                                {state.nextSlotCostKas.toLocaleString()} KAS
                              </span>
                              <span className="mx-1.5 text-zinc-500">→</span>
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {getKasPriceAfterDiscount(state.nextSlotCostKas).toLocaleString()} KAS
                              </span>
                            </span>
                          ) : (
                            <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                              {state.nextSlotCostKas.toLocaleString()} KAS
                            </span>
                          )}
                        </div>
                      </Tooltip>
                    </div>
                    <Tooltip content="V1 mock action. This will wire into KAS payment later through the global payments SDK.">
                      <button type="button" onClick={() => void actions.addSlot(state.nextSlotCostKas)} className="k-cta-games h-11 px-6 text-sm">
                        Add
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <MinecoreMiningSections state={state} computeCtx={minecoreComputeContext} />
            </div>
          )}

          {tab === 'power' && (
            <MinecorePowerPanel
              state={state}
              now={nowTick}
              computeCtx={minecoreComputeContext}
              getKasPriceAfterDiscount={getKasPriceAfterDiscount}
              onDemoTopUpFirstPlant={() => {
                actions.topUpPower(0, 5);
              }}
              onRechargePlant={(idx) => {
                void actions.rechargePlantWithKAS(idx);
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
                await actions.rechargePlantWithKAS(idx);
              }}
            />
          )}

          {tab === 'workers' && (
            <div className="space-y-6">
              <MinecoreOwnedWorkersPanel nftSlots={state.nftSlots} />
              <WorkersPanel
                slots={state.nftSlots}
                slottedMetadata={slottedMetadata}
                autoRestart={state.automation.autoRestart}
                autoRestartInfrastructureActive={autoRestartInfrastructureActive}
                onToggleAutoRestart={(enabled) => actions.setAutomation({ autoRestart: enabled })}
                onDeploy={actions.deployNFT}
                onRemove={(slotIndex) => actions.removeNFT(slotIndex)}
                onPurchaseExtraSlot={actions.purchaseNftDeckSlot}
                slotPurchaseKas={getKasPriceAfterDiscount(MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS)}
                miningAllowed={miningAllowed}
              />
            </div>
          )}

          {tab === 'shop' && (
            <ShopPanel
              ingredients={state.ingredients}
              getKasPriceAfterDiscount={getKasPriceAfterDiscount}
              onBuyIngredient={async ({ ingredient, currency, quantity }) => {
                if (currency === 'KAS') {
                  const unit = CALC_INGREDIENT_KAS[ingredient];
                  await actions.purchaseIngredientWithKAS(ingredient, {
                    amount: quantity,
                    amountKas: unit * quantity,
                  });
                }
              }}
              onBuy={async ({ itemId, currency, quantity }) => {
                if (itemId === 'power-topup' && currency === 'KAS') {
                  const p0 = state.plantSlots[0];
                  const n = p0 ? getPlantBatterySlotCount(p0.type) : 1;
                  const count = Math.max(1, Math.min(quantity, n));
                  await actions.rechargePlantWithKAS(0, {
                    batterySlotIndexes: Array.from({ length: count }, (_, i) => i),
                  });
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
