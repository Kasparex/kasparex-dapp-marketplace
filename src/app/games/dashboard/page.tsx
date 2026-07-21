'use client';

import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GamesSidebar } from '@/components/games/GamesSidebar';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxInFormPremiumRow } from '@/components/ui/KxInFormPremiumRow';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { HubFlowProgress } from '@/components/hub/HubFlowProgress';
import { getHubFlowPreset } from '@/lib/hub/hubFlowProgress';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HubDashboardPageHeader } from '@/components/hub/HubDashboardPageHeader';
import {
  KX_FORM_GRID,
  KX_FORM_PANEL,
  KX_FORM_STICKY_RAIL,
  KX_CALCULATION_ASIDE,
  KX_PREMIUM_MODULE_CARD,
  KX_DASHBOARD_TAB_SHELL,
  KX_DASHBOARD_TAB_BTN,
  KX_DASHBOARD_TAB_BTN_ACTIVE,
} from '@/lib/hub/shellTokens';
import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { HubPaymentCurrencyDropdown } from '@/components/payments/HubPaymentCurrencyDropdown';
import { buildKasKrexMenuOptions } from '@/lib/payments/hubPaymentTypes';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { listingActionFeeLabel } from '@/lib/dapps/listingSubmissions';
import {
  estimateHubListingQuote,
  hubListingCommitNote,
  type HubListingModuleLine,
} from '@/lib/hub/listingPricing';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { HubListingCalculationBreakdown } from '@/components/hub/HubListingCalculationBreakdown';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { htmlToPlainText } from '@/lib/richText/html';
import { HubPointsEarnBadge } from '@/components/hub/HubPointsEarnBadge';

type GamePromoListing = {
  id: string;
  wallet: string;
  title: string;
  shortDescription: string;
  content: string;
  coverUrl: string;
  status: 'draft' | 'published';
  createdAt: string;
  feeTxHash?: string;
  feeAmountKas?: number;
  paymentCurrency?: StorePaymentCurrency;
};

const STORAGE_KEY = 'kasparex_games_dashboard_promotions';
const BASE_FEE_KAS = 25;
const PREMIUM_MODULE_FEE_KAS = 10;

function readAllListings(): GamePromoListing[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as GamePromoListing[];
  } catch {
    return [];
  }
}

function readListings(wallet?: string | null): GamePromoListing[] {
  if (!wallet) return [];
  return readAllListings().filter((x) => x.wallet.toLowerCase() === wallet.toLowerCase());
}

function saveListing(listing: GamePromoListing): void {
  if (typeof window === 'undefined') return;
  const all = readAllListings();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([listing, ...all]));
}

export default function GamesDashboardPage() {
  const { state } = useKaspaWallet();
  const { payActionFee, isProcessing, error, setError } = useDAppListingPayment();
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const [tab, setTab] = useState<'overview' | 'listings' | 'create'>('overview');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [boostEnabled, setBoostEnabled] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [listingsVersion, setListingsVersion] = useState(0);

  const listings = useMemo(() => readListings(state.address), [state.address, listingsVersion]);

  const moduleLines = useMemo((): HubListingModuleLine[] => {
    if (!boostEnabled) return [];
    return [{ id: 'featured', title: 'Featured placement module', kas: PREMIUM_MODULE_FEE_KAS }];
  }, [boostEnabled]);

  const formQuote = useMemo(
    () =>
      estimateHubListingQuote({
        action: 'create',
        baseFeeKas: BASE_FEE_KAS,
        discountPercent: krexTierDiscountPercent(krexTier),
        moduleLines,
        fields: {
          kind: 'games-promo',
          title: title.trim(),
          shortDescription: shortDescription.trim(),
          content: htmlToPlainText(content).trim(),
          coverUrl: coverUrl.trim(),
          featuredPlacementEnabled: boostEnabled,
        },
      }),
    [krexTier, moduleLines, title, shortDescription, content, coverUrl, boostEnabled],
  );
  const feeLabel = listingActionFeeLabel(paymentCurrency, formQuote.totalKas);

  const canSubmit = Boolean(
    state.isConnected && state.address && title.trim() && shortDescription.trim() && !isProcessing,
  );

  const handleSave = async () => {
    setError(null);
    if (!state.isConnected || !state.address) {
      setError('Connect your Kaspa wallet to publish a game promotion.');
      return;
    }
    if (!title.trim() || !shortDescription.trim()) {
      setError('Title and short description are required.');
      return;
    }

    try {
      const commitNote = hubListingCommitNote({
        kind: 'games-promo',
        contentHash: formQuote.contentHash,
        payloadBytes: formQuote.payloadBytes,
        chunkCount: formQuote.chunkCount,
        totalKas: formQuote.totalKas,
      });
      const feeTxHash = await payActionFee(paymentCurrency, formQuote.totalKas, commitNote);
      const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;

      saveListing({
        id: `game-${Date.now()}`,
        wallet: state.address,
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        content: content.trim(),
        coverUrl: coverUrl.trim(),
        status: 'published',
        createdAt: new Date().toISOString(),
        feeTxHash: txNorm,
        feeAmountKas: formQuote.totalKas,
        paymentCurrency,
      });

      appendHubActivityEarn({
        walletRaw: state.address,
        source: 'games_promo_list',
        redeemableDelta: HUB_EARN_POINTS.gamesPromoList,
        krexBalance,
        idempotencyKey: `games:promo:${txNorm}`,
        meta: { title: title.trim() },
      });

      setTitle('');
      setShortDescription('');
      setContent('');
      setCoverUrl('');
      setBoostEnabled(false);
      setListingsVersion((v) => v + 1);
      setTab('listings');
    } catch {
      /* payActionFee sets error */
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <HubAccentScope projectId="kasparex-games" className="flex flex-1 flex-col lg:flex-row">
        <div className="hidden lg:block">
          <GamesSidebar
            selectedGameTypes={[]}
            onGameTypeChange={() => {}}
            selectedDifficulties={[]}
            onDifficultyChange={() => {}}
            selectedStatuses={[]}
            onStatusChange={() => {}}
            gameTypeCounts={{ puzzle: 0, arcade: 0, strategy: 0, casual: 0, multiplayer: 0, trivia: 0, skill: 0 }}
            difficultyCounts={{ easy: 0, medium: 0, hard: 0, expert: 0 }}
            statusCounts={{ beta: 0, active: 0, 'coming-soon': 0, maintenance: 0 }}
            searchQuery=""
            onSearchChange={() => {}}
            onResetFilters={() => {}}
            showCategories={false}
            backLink={{ href: '/hub', label: 'Back to Hub' }}
          />
        </div>

        <section className="flex-1 border-l border-zinc-200 p-4 sm:p-6 lg:p-10 dark:border-zinc-800">
          <HubDashboardPageHeader
            kicker="Games dashboard"
            title="Games"
            titleAccent="Creator Center"
            excerpt="List and promote game projects with modular Hub pricing, KREX discounts, and Hub Points."
            meta={
              state.address ? (
                <p className="font-mono text-xs text-zinc-500">{state.address}</p>
              ) : null
            }
          />

          <div className={`${KX_DASHBOARD_TAB_SHELL} mb-6 flex-wrap`}>
            {(['overview', 'listings', 'create'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`${KX_DASHBOARD_TAB_BTN} ${tab === item ? KX_DASHBOARD_TAB_BTN_ACTIVE : ''}`}
              >
                {item === 'overview' ? 'Overview' : item === 'listings' ? 'My Listings' : 'List Project'}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <VBlogFeeCard title="Listing Fee" feeKas={BASE_FEE_KAS} basePoints={HUB_EARN_POINTS.gamesPromoList} />
              <VBlogFeeCard title="Featured module" feeKas={PREMIUM_MODULE_FEE_KAS} />
              <VBlogFeeCard
                title="Hub points"
                feeKas={0}
                note={`Earn +${HUB_EARN_POINTS.gamesPromoList} pts on publish`}
              />
            </div>
          ) : null}

          {tab === 'overview' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Published promotions</p>
                <p className="mt-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">{listings.length}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Hub points on publish</p>
                <div className="mt-2">
                  <HubPointsEarnBadge points={HUB_EARN_POINTS.gamesPromoList} size="md" showMinSpendTooltip={false} />
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'listings' ? (
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">My game promotions</h2>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {listings.length === 0 ? (
                  <p className="p-8 text-sm text-zinc-500">
                    No listings yet. Open the List Project tab to add your first promotion.
                  </p>
                ) : (
                  listings.map((item) => (
                    <div key={item.id} className="p-5">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{item.shortDescription}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {tab === 'create' ? (
            <div className={`${KX_FORM_GRID} items-start`}>
              <div className="flex min-w-0 flex-col gap-6">
                <div className={`${KX_FORM_PANEL} space-y-6`}>
                  <div>
                    <DAppSectionHeader title="Main content" className="mb-3" />
                    <h3 className="mb-4 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      List Game Project
                    </h3>
                    <p className="kx-body">
                      Promotion listing for now. Estimated cost: {formQuote.totalKas} KAS (
                      {formQuote.chunkCount} chunks, {formQuote.payloadBytes} bytes)
                      {formQuote.discountKas > 0 ? ' (KREX holder discount)' : ''}.
                    </p>
                  </div>
                  <div>
                    <KxFormFieldLabel required>Project title</KxFormFieldLabel>
                    <input className="k-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div>
                    <KxFormFieldLabel required>Short description</KxFormFieldLabel>
                    <textarea
                      className="k-textarea min-h-[90px]"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <KxFormFieldLabel>Cover image URL</KxFormFieldLabel>
                    <input
                      className="k-input"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <KxFormFieldLabel>Details (rich text)</KxFormFieldLabel>
                    <KxRichTextEditor value={content} onChange={setContent} minRows={10} />
                  </div>
                </div>

                <div id="games-dashboard-modules" className={`${KX_FORM_PANEL} my-2 scroll-mt-24 space-y-6 py-10 sm:py-12`}>
                  <div className="space-y-2">
                    <DAppSectionHeader title="Premium modules" className="mb-0" />
                    <h4 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      Optional premium features
                    </h4>
                  </div>
                  <div className={KX_PREMIUM_MODULE_CARD}>
                    <KxInFormPremiumRow
                      flat
                      accent="hub"
                      title="Featured placement module"
                      description="Boost placement in upcoming Games spotlight sections."
                      priceLabel={`+${PREMIUM_MODULE_FEE_KAS} KAS`}
                      checked={boostEnabled}
                      onToggle={() => setBoostEnabled((v) => !v)}
                    />
                    {boostEnabled ? (
                      <div className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Featured module is active. Boost settings stay inside this container.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={KX_FORM_STICKY_RAIL}>
                <HubBenefitsPanel variant="panel" scope="games" />
                <aside className={KX_CALCULATION_ASIDE}>
                  <HubListingCalculationBreakdown
                    quote={formQuote}
                    hubPoints={HUB_EARN_POINTS.gamesPromoList}
                    footerNote="One Kaspa L1 payment covers the listing, payload size, and any enabled modules."
                    className="contents"
                  />

                  <div>
                    <span className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Pay with *</span>
                    <HubPaymentCurrencyDropdown
                      value={paymentCurrency}
                      onChange={setPaymentCurrency}
                      options={buildKasKrexMenuOptions()}
                      ariaLabel="Listing fee currency"
                    />
                    <p className="mt-2 text-xs text-zinc-500">Amount due: {feeLabel}</p>
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={!canSubmit}
                    className="hub-cta-btn w-full k-control-btn !text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Publish Game Promotion'}
                  </button>
                  <HubFlowProgress steps={getHubFlowPreset('hubPublish')} busy={isProcessing} />
                </aside>
              </div>
            </div>
          ) : null}
        </section>
      </HubAccentScope>
      <Footer />
    </div>
  );
}
