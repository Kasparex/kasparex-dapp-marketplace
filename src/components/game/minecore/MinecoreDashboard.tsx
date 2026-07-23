'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { TooltipProvider, Tooltip } from '@/components/ui/Tooltip';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import { DiamondIcon } from '@/components/games/icons/DiamondIcon';
import { useMinecore } from '@/hooks/useMinecore';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { useKaspaBalance } from '@/hooks/useKaspaBalance';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import {
  computeMinecoreDeckLiveYieldRatePerMin,
  computeMinecoreDiamondsDisplayTotal,
  computeMinecoreRollingDailyCapDeckTotals,
  minecoreEligiblePremiumOperatorLinkedForKasPlantExpand,
} from '@/lib/game/minecore/compute';
import { getPlantBatterySlotCount, normalizeBatteryIds } from '@/lib/game/minecore/battery-utils';
import { PlantSlotCard } from '@/components/game/minecore/PlantSlotCard';
import { FabricationPanel } from '@/components/game/minecore/FabricationPanel';
import { ShopPanel } from '@/components/game/minecore/ShopPanel';
import { MinecoreArticle } from '@/components/game/minecore/MinecoreArticle';
import { MinecorePowerPanel } from '@/components/game/minecore/MinecorePowerPanel';
import { MinecoreRewardsPanel } from '@/components/game/minecore/MinecoreRewardsPanel';
import { MinecoreMiningTabFooter } from '@/components/game/minecore/MinecoreMiningSections';
import { MinecoreMaintenanceCostsPanel } from '@/components/game/minecore/MinecoreMaintenanceCostsPanel';
import { MinecoreBulkMiningButton } from '@/components/game/minecore/MinecoreBulkMiningButton';
import { MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS, MINECORE_GRID_PER_REFINEMENT_POINT, MINECORE_REFINE_POINTS_PER_DIAMOND, minecoreKrexFromDiscountedKas } from '@/lib/game/minecore/config';
import { CALC_INGREDIENT_KAS, CALC_INGREDIENT_GRID } from '@/lib/game/minecore/calculator';
import type { MinecoreIngredient } from '@/lib/game/minecore';
import { KREX_TIER_SHOP_DISCOUNT_PCT } from '@/lib/game/diamond-veins-config';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { IconOverview, IconShop, IconWorkers, IconRewards, IconBoosters, IconPower, IconComments, IconMilestones } from '@/components/games/icons/TabIcons';
import { useGameCommentsTabs, gameCommentsArticleId } from '@/components/games/comments/gameComments';
import { WorkersPanel } from '@/components/game/minecore/WorkersPanel';
import { CrewPlantFeaturesPanel } from '@/components/game/minecore/CrewPlantFeaturesPanel';
import { MinecoreOwnedWorkersPanel } from '@/components/game/minecore/MinecoreOwnedAssetsPanel';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { GamesAdaptiveGrid } from '@/components/games/layout/GamesAdaptiveGrid';
import { GameCurrencyMenu } from '@/components/games/shop/GameCurrencyMenu';
import { MilestonesPanel } from '@/components/games/modules/MilestonesPanel';
import { useGameMilestones } from '@/hooks/useGameMilestones';
import * as Icons from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'mining', label: '1. Mining', icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" /> },
  { id: 'fabrication', label: '2. Build', icon: <IconBoosters /> },
  { id: 'power', label: '3. Power', icon: <IconPower /> },
  { id: 'workers', label: '4. Crew', icon: <IconWorkers /> },
  { id: 'shop', label: 'Shop', icon: <IconShop /> },
  { id: 'redeem', label: 'Redeem', icon: <IconRewards /> },
  { id: 'milestones', label: 'Milestones', icon: <IconMilestones /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

const CommentsSection = dynamic(() => import('@/components/vblog/CommentsSection').then((m) => m.CommentsSection), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      Loading comments…
    </div>
  ),
});

type TabId = (typeof TABS)[number]['id'];

const MINECORE_DECK_FEATURED_TOOLTIP =
  'Beneath the neon spine of Kaspaland, Diamond Veins pulse with raw energy. Minecore, built and controlled by Krex and his crew, drills into these unstable depths to extract Diamonds from the heart of the network. This is not just mining, it is tapping into the force that powers Kaspaland.';

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
  const redeemBreakdown = useRedeemablePointsBreakdown();
  const redeemUnifiedMatches = useMemo(() => {
    const w = wallet.address?.trim();
    if (!w || !redeemBreakdown.address) return false;
    try {
      return normalizeKaspaAddress(w) === redeemBreakdown.address;
    } catch {
      const nw = w.startsWith('kaspa:') ? w : `kaspa:${w}`;
      return nw.toLowerCase() === redeemBreakdown.address.toLowerCase();
    }
  }, [wallet.address, redeemBreakdown.address]);
  const redeemPtsUi = redeemUnifiedMatches ? redeemBreakdown.totalRedeemable : Math.floor(state.refinementPointsTotal);
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
  const [expandPayCurrency, setExpandPayCurrency] = useState<'KREX' | 'KAS'>('KREX');

  const kasPlantExpandAllowed = useMemo(
    () => minecoreEligiblePremiumOperatorLinkedForKasPlantExpand(state, minecoreComputeContext),
    [state, minecoreComputeContext],
  );

  useEffect(() => {
    if (expandPayCurrency === 'KAS' && !kasPlantExpandAllowed) setExpandPayCurrency('KREX');
  }, [expandPayCurrency, kasPlantExpandAllowed]);

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

  const [redeemShowStartAllMines, setRedeemShowStartAllMines] = useState(false);

  const bulkMiningControl = (
    <MinecoreBulkMiningButton
      variant="mining-toolbar"
      plantSlots={state.plantSlots}
      miningAllowed={miningAllowed}
      onStartAll={actions.startMiningAllPlants}
      onPauseAll={actions.pauseMiningAllPlants}
      onResumeAll={actions.resumeMiningAllPlants}
    />
  );

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
  const deckLiveYieldPerMin = useMemo(
    () => computeMinecoreDeckLiveYieldRatePerMin(state, nowTick, minecoreComputeContext),
    [state, nowTick, minecoreComputeContext],
  );

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
        label: 'In-game currency',
        value: (
          <span className="inline-flex flex-wrap items-baseline justify-end gap-x-0 text-lg font-black tabular-nums tracking-tight sm:text-xl">
            <span className="text-amber-400 dark:text-amber-300">{diamondsDisplayTotal.toLocaleString()}</span>
            <span className="px-1 text-sm font-bold text-zinc-500 dark:text-zinc-400">of</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {Math.max(0, Math.floor(deckRollingCaps.capSum)).toLocaleString()}
            </span>
            <span className="pl-1.5 text-sm font-bold text-zinc-500 dark:text-zinc-400">/ 24h</span>
          </span>
        ),
        subValue: (
          <>
            <span className="font-semibold tabular-nums">{deckLiveYieldPerMin.toFixed(1)}</span>
            <span className="font-bold text-zinc-500 dark:text-zinc-400"> D/min (total)</span>
          </>
        ),
        description: 'Diamonds',
        tooltip:
          'Diamonds you earn in plants; refine into redeem points. Subtext is total live diamond yield rate (D/min) summed across plants that are actively mining right now. Opens Redeem.',
        accent: 'diamonds' as const,
        icon: <DiamondIcon className="h-4 w-4 text-sky-400" title="Diamonds" />,
        onClick: () => setTab('redeem' as const),
      },
      {
        id: 'redeem_points',
        label: 'Redeem points',
        value: redeemPtsUi.toLocaleString(),
        subValue: (
          <>
            ~ <span className="font-semibold tabular-nums">{Math.floor(redeemPtsUi * MINECORE_GRID_PER_REFINEMENT_POINT).toLocaleString()}</span> GRID at rate
          </>
        ),
        description: 'Unified redeemable',
        tooltip:
          'Your full redeemable balance across Kasparex Hub (gameplay-linked points plus your Rewards wallet). It updates when you redeem on Rewards. GRID and KREX swaps on this page only use points earned in this game — use Rewards for the rest.',
        accent: 'purple' as const,
        onClick: () => setTab('redeem' as const),
      },
    ],
    [
      diamondsDisplayTotal,
      deckLiveYieldPerMin,
      deckRollingCaps.capSum,
      redeemPtsUi,
    ]
  );

  const tabsWithComments = useGameCommentsTabs(TABS, 'minecore');

  const categories = (_props.game?.categories ?? []) as string[];
  const tags = (_props.game?.tags ?? []) as string[];

  const milestoneProgress = useMemo(
    () => ({
      diamonds_earned: Math.floor((state.refinementPointsEarnedLifetime ?? 0) + (state.diamondsBalance ?? 0)),
      diamonds_balance: Math.floor(state.diamondsBalance ?? 0),
      plants_unlocked: state.plantSlots.filter((p) => p.unlocked).length,
      plant_tier: Math.max(
        0,
        ...state.plantSlots.map((p) => {
          const order = ['standard', 'premium', 'advanced', 'industrial', 'elite', 'dominion'] as const;
          const idx = order.indexOf(String(p.type).toLowerCase() as (typeof order)[number]);
          return idx >= 0 ? idx + 1 : p.unlocked ? 1 : 0;
        }),
      ),
      refinement_points: state.refinementPointsTotal,
    }),
    [state.refinementPointsEarnedLifetime, state.diamondsBalance, state.plantSlots, state.refinementPointsTotal],
  );
  const { level: playerLevel } = useGameMilestones('minecore', milestoneProgress);

  return (
    <TooltipProvider>
      <KREXBuyWizard isOpen={krexWizardOpen} onClose={() => setKrexWizardOpen(false)} />
      <div className="flex flex-col space-y-6">
        {profileNotice || lastPaymentError || lastSetupError ? (
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
        ) : null}
        <UnifiedGameLayout
          tabs={tabsWithComments as any}
          currentTab={tab}
          onTabChange={setTab}
          resources={resources}
          playerLevel={playerLevel}
          game={{
            ...(_props.game ?? {}),
            name: _props.gameName ?? _props.game?.name ?? 'Minecore',
            description: _props.gameDescription ?? _props.game?.description ?? '',
            featuredImage: _props.featuredImage || _props.game?.featuredImage,
            image: _props.game?.image,
            categories,
            tags,
          }}
          onOpenOverview={openOverview}
          deckFooter={<span>Values update live as you mine, refine, and pay for slots.</span>}
          deckFeaturedTooltip={MINECORE_DECK_FEATURED_TOOLTIP}
          showDeckInfoButton={false}
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
                trailing={bulkMiningControl}
              />

              <GamesAdaptiveGrid>
                {filteredMiningSlots.map(({ slot, slotIndex }) => (
                  <div key={`plant-slot-${slotIndex}`} className="min-w-0">
                    <PlantSlotCard
                      minecoreState={state}
                    minecoreComputeContext={minecoreComputeContext}
                    slot={slot}
                    slotArrayIndex={slotIndex}
                    now={nowTick}
                    getKasPriceAfterDiscount={getKasPriceAfterDiscount}
                    onUnlock={() => void actions.unlockSlot(slotIndex, slot.unlockCostKas)}
                    onStart={() => actions.startMining(slotIndex)}
                    onStopMining={() => actions.stopMining(slotIndex)}
                    onResumeMining={() => actions.resumeMining(slotIndex)}
                    onExtract={() => actions.extract(slotIndex)}
                    onRechargePlant={async (opts) => {
                      void (await actions.rechargePlant(slotIndex, opts));
                    }}
                    stabilityPatches={state.stabilityPatches}
                    onRepairPlant={(opts) => actions.repairPlantWithPayment(slotIndex, opts)}
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
                        case 'powerNodes':
                          actions.setPlantPowerNodes(slotIndex, id);
                          break;
                        case 'modules':
                          actions.setModules(slotIndex, id);
                          break;
                        default:
                          break;
                      }
                    }}
                    onChangePlantType={(type, cost, opts) => actions.changePlantType(slotIndex, type, cost, opts)}
                    onTogglePlantAutoRestartMining={(enabled) =>
                      actions.setPlantAutoRestartMining(slotIndex, enabled)
                    }
                    onAssignPlantCrewDeckIndices={(indices) =>
                      actions.assignPlantCrewDeckIndices(slotIndex, indices)
                    }
                  />
                  </div>
                ))}

                <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                  <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Expansion</div>
                  <Tooltip
                    content={gameTooltipRich(
                      'Add Mining Plant',
                      <>
                        <p>
                          Default payment is <strong>KREX</strong> (treasury transfer pegged to the discounted KAS list price).{' '}
                          <strong>KAS</strong> is optional only when a <strong>Diamond</strong> or <strong>Rarest</strong>{' '}
                          <strong>KREXPRIME</strong> or <strong>PIXELKREX</strong> is assigned on an <strong>Operator</strong> crew deck linked from any unlocked plant.
                        </p>
                        <p className="mt-2">
                          List peg {state.nextSlotCostKas.toLocaleString()} KAS ·{' '}
                          {krexDiscountPct > 0 ? `${krexTier}: −${krexDiscountPct}% tier discount on eligible rails.` : `${krexTier}: list rate.`}
                        </p>
                      </>,
                    )}
                  >
                    <div className="mt-1 cursor-help">
                      <div className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-100">Add Mining Plant</div>
                    </div>
                  </Tooltip>
                  <div className="mt-2 text-sm font-semibold tabular-nums">
                    {expandPayCurrency === 'KREX' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {minecoreKrexFromDiscountedKas(getKasPriceAfterDiscount(state.nextSlotCostKas)).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}{' '}
                        KREX
                      </span>
                    ) : krexDiscountPct > 0 ? (
                      <span className="text-zinc-800 dark:text-zinc-100">
                        <span className="text-zinc-400 line-through decoration-zinc-400/80">
                          {state.nextSlotCostKas.toLocaleString()} KAS
                        </span>
                        <span className="mx-1.5 text-zinc-500">→</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {getKasPriceAfterDiscount(state.nextSlotCostKas).toLocaleString()} KAS
                        </span>
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {getKasPriceAfterDiscount(state.nextSlotCostKas).toLocaleString()} KAS
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <GameCurrencyMenu
                      ariaLabel="Expansion payment currency"
                      value={expandPayCurrency}
                      onChange={(v) => setExpandPayCurrency(v as 'KREX' | 'KAS')}
                      options={[
                        {
                          value: 'KREX',
                          label: `${minecoreKrexFromDiscountedKas(getKasPriceAfterDiscount(state.nextSlotCostKas)).toLocaleString(undefined, { maximumFractionDigits: 0 })} KREX`,
                        },
                        {
                          value: 'KAS',
                          label: `${getKasPriceAfterDiscount(state.nextSlotCostKas).toLocaleString(undefined, { maximumFractionDigits: 6 })} KAS`,
                          disabled: !kasPlantExpandAllowed,
                          rowTooltip: gameTooltipRich(
                            'Pay with KAS',
                            'Payment in KAS is available only when a Diamond or Rarest KREXPRIME or PIXELKREX is assigned to an Operator in the Crew tab and linked from an unlocked plant.',
                          ),
                        },
                      ]}
                      className="w-full"
                      buttonClassName="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    />
                    <button
                      type="button"
                      onClick={() => void actions.addSlot(expandPayCurrency)}
                      className="k-cta-games h-10 w-full shrink-0 px-4 text-sm font-bold uppercase tracking-wide"
                    >
                      Add plant
                    </button>
                  </div>
                </div>
              </GamesAdaptiveGrid>

              <MinecoreMiningTabFooter />
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
                const slot = state.plantSlots[idx];
                if (!slot?.unlocked) return;
                const ids = normalizeBatteryIds(slot.setup, slot.type);
                const batterySlotIndexes = ids
                  .map((id, i) => (id != null ? i : null))
                  .filter((x): x is number => x != null);
                if (batterySlotIndexes.length === 0) return;
                if (currency === 'KREX') {
                  await actions.rechargePlant(idx, { batterySlotIndexes, currency: 'KREX' });
                  return;
                }
                await actions.refillBatteryWithKAS(idx);
              }}
              onReservePack={async (idx, currency) => {
                if (currency === 'KREX') {
                  await actions.topUpPowerWithKREX(idx, {
                    added: 3,
                    amountKrex: minecoreKrexFromDiscountedKas(getKasPriceAfterDiscount(6)),
                  });
                  return;
                }
                await actions.topUpPowerWithKAS(idx, { added: 3, amountKas: 6 });
              }}
              onRuntimeBundle={async (idx, currency) => {
                if (currency === 'KREX') {
                  await actions.rechargePlant(idx, { currency: 'KREX' });
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
                onDeploy={actions.deployNFT}
                onRemove={(slotIndex) => actions.removeNFT(slotIndex)}
                onPurchaseExtraSlot={actions.purchaseNftDeckSlot}
                slotPurchaseKas={getKasPriceAfterDiscount(MINECORE_DEFAULT_SLOT_UNLOCK_COST_KAS)}
                miningAllowed={miningAllowed}
              />
              <CrewPlantFeaturesPanel />
            </div>
          )}

          {tab === 'shop' && (
            <ShopPanel
              minecoreState={state}
              ingredients={state.ingredients}
              plantSlots={state.plantSlots}
              getKasPriceAfterDiscount={getKasPriceAfterDiscount}
              onBuyIngredient={async ({ ingredient, currency, quantity }) => {
                const q = Math.max(1, Math.floor(quantity));
                if (currency === 'KAS') {
                  const unit = CALC_INGREDIENT_KAS[ingredient as MinecoreIngredient];
                  await actions.purchaseIngredientWithKAS(ingredient as MinecoreIngredient, {
                    amount: q,
                    amountKas: unit * q,
                  });
                  return;
                }
                if (currency === 'KREX') {
                  const unitKas = CALC_INGREDIENT_KAS[ingredient as MinecoreIngredient];
                  const amountKrex = minecoreKrexFromDiscountedKas(getKasPriceAfterDiscount(unitKas)) * q;
                  if (amountKrex <= 0) return;
                  await actions.purchaseIngredientWithKREX(ingredient as MinecoreIngredient, {
                    amount: q,
                    amountKrex,
                  });
                  return;
                }
                if (currency === 'GRID') {
                  const unit = CALC_INGREDIENT_GRID[ingredient as MinecoreIngredient];
                  if (unit == null) return;
                  actions.purchaseIngredientWithGrid(ingredient as MinecoreIngredient, {
                    amount: q,
                    gridCost: unit * q,
                  });
                }
              }}
              onBuy={async ({ itemId, currency, quantity, boostTargetSlotIndex }) => {
                const q = Math.max(1, Math.floor(quantity));
                const isStarterPack = itemId === 'minecore-reactor-pack-starter';
                const isAdvancedPack = itemId === 'minecore-reactor-pack-advanced';

                if (isStarterPack && currency === 'KAS') {
                  await actions.purchaseIngredientPackWithKAS(
                    {
                      circuitMesh: 14 * q,
                      energyCells: 9 * q,
                      fluxCoils: 6 * q,
                      helixStabilizers: 5 * q,
                      plasmaConduits: 4 * q,
                    },
                    { amountKas: 42 * q, skuId: 'minecore:shop:reactor-pack-starter' },
                  );
                }
                if (isStarterPack && currency === 'KREX') {
                  await actions.purchaseIngredientPackWithKREX(
                    {
                      circuitMesh: 14 * q,
                      energyCells: 9 * q,
                      fluxCoils: 6 * q,
                      helixStabilizers: 5 * q,
                      plasmaConduits: 4 * q,
                    },
                    {
                      amountKrex: minecoreKrexFromDiscountedKas(getKasPriceAfterDiscount(42)) * q,
                      skuId: 'minecore:shop:reactor-pack-starter:krex',
                    },
                  );
                }
                if (isAdvancedPack && currency === 'KAS') {
                  await actions.purchaseIngredientPackWithKAS(
                    {
                      latticeWire: 12 * q,
                      coreShards: 5 * q,
                      nullFragments: 2 * q,
                      fluxCoils: 10 * q,
                      quantumAttuners: 4 * q,
                      voidglassFilaments: 3 * q,
                    },
                    { amountKas: 88 * q, skuId: 'minecore:shop:reactor-pack-advanced' },
                  );
                }
                if (isAdvancedPack && currency === 'KREX') {
                  await actions.purchaseIngredientPackWithKREX(
                    {
                      latticeWire: 12 * q,
                      coreShards: 5 * q,
                      nullFragments: 2 * q,
                      fluxCoils: 10 * q,
                      quantumAttuners: 4 * q,
                      voidglassFilaments: 3 * q,
                    },
                    {
                      amountKrex: minecoreKrexFromDiscountedKas(getKasPriceAfterDiscount(88)) * q,
                      skuId: 'minecore:shop:reactor-pack-advanced:krex',
                    },
                  );
                }
                if (itemId === 'power-topup' && currency === 'KAS') {
                  const p0 = state.plantSlots[0];
                  const n = p0 ? getPlantBatterySlotCount(p0.type) : 1;
                  const count = Math.max(1, Math.min(quantity, n));
                  await actions.rechargePlantWithKAS(0, {
                    batterySlotIndexes: Array.from({ length: count }, (_, i) => i),
                  });
                }
                if (itemId === 'power-topup' && currency === 'KREX') {
                  const p0 = state.plantSlots[0];
                  const n = p0 ? getPlantBatterySlotCount(p0.type) : 1;
                  const count = Math.max(1, Math.min(quantity, n));
                  await actions.rechargePlant(0, {
                    batterySlotIndexes: Array.from({ length: count }, (_, i) => i),
                    currency: 'KREX',
                  });
                }
                if (itemId === 'kas-overclock' && currency === 'KAS') {
                  const idx = Math.max(0, Math.floor(boostTargetSlotIndex ?? 0));
                  await actions.purchaseKasOverclockWithKAS(idx, q);
                }
                if (itemId === 'kas-overclock' && currency === 'KREX') {
                  const idx = Math.max(0, Math.floor(boostTargetSlotIndex ?? 0));
                  await actions.purchaseKasOverclockWithKREX(idx, q);
                }
                if (itemId === 'krex-boost' && currency === 'KREX') {
                  await actions.purchaseKrexBoostChargesWithKREX(q);
                }
                if (itemId === 'repair' && currency === 'KAS') {
                  await actions.purchaseStabilityPatchesWithKAS(q);
                }
                if (itemId === 'repair' && currency === 'KREX') {
                  await actions.purchaseStabilityPatchesWithKREX(q);
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
                unifiedRedeemablePoints={redeemUnifiedMatches ? redeemBreakdown.totalRedeemable : undefined}
                hubLedgerNetPoints={redeemUnifiedMatches ? redeemBreakdown.ledgerNetRedeemable : undefined}
                localLedger={state.gridLedger ?? []}
                onRefine={(amount) => {
                  actions.refine(amount);
                  if (miningAllowed) setRedeemShowStartAllMines(true);
                }}
                onRedeem={actions.redeemGrid}
                minecoreExtras={{
                  redeemBudgetDayKey: state.redeemBudget?.dayKey,
                  refinementPointsSpentOnGrid: state.redeemBudget?.refinementPointsSpentOnGrid,
                  refinementPointsSpentOnKrex: state.redeemBudget?.refinementPointsSpentOnKrex,
                  gridRedeemablePending: state.gridRedeemableTotal,
                  krexRedeemablePending: state.krexRedeemableTotal,
                }}
                diamondRefinementHeaderTrailing={
                  redeemShowStartAllMines ? (
                    <MinecoreBulkMiningButton
                      variant="redeem-start-all"
                      plantSlots={state.plantSlots}
                      miningAllowed={miningAllowed}
                      onStartAll={actions.startMiningAllPlants}
                    />
                  ) : undefined
                }
              />
            </div>
          )}

          {tab === 'milestones' && <MilestonesPanel gameId="minecore" progress={milestoneProgress} />}

          {tab === 'comments' && (
            <CommentsSection articleId={gameCommentsArticleId('minecore')} dappSectionHeader />
          )}
        </UnifiedGameLayout>
      </div>
    </TooltipProvider>
  );
}
