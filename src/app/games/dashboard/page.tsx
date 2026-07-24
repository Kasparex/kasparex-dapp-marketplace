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
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HubDashboardPageHeader } from '@/components/hub/HubDashboardPageHeader';
import {
  KX_FORM_GRID,
  KX_FORM_PANEL,
  KX_CALCULATION_ASIDE,
  KX_PREMIUM_MODULE_CARD,
  KX_DASHBOARD_TAB_SHELL,
  KX_DASHBOARD_TAB_BTN,
  KX_DASHBOARD_TAB_BTN_ACTIVE,
} from '@/lib/hub/shellTokens';
import { VBlogFeeCard } from '@/components/vblog/VBlogPricingCards';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import {
  estimateHubListingQuote,
  hubListingCommitNote,
  type HubListingModuleLine,
} from '@/lib/hub/listingPricing';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import { HubListingCalculationBreakdown } from '@/components/hub/HubListingCalculationBreakdown';
import { creditHubListingEarn } from '@/lib/rewards/creditHubListingEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { HUB_DELETE_FEE_KAS_STANDARD } from '@/lib/hub/paidDelete';
import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import { collectGamesPromoMediaCids, requestIpfsUnpin } from '@/lib/ipfs/cidUtils';
import { htmlToPlainText } from '@/lib/richText/html';
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import { KxFieldCharCount } from '@/components/ui/KxFieldCharCount';
import { HUB_FORM_LIMITS } from '@/lib/hub/formLimits';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { normalizeIpfsUrlForForm } from '@/lib/ipfs/gateway';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KX_LISTING_PLACEHOLDER_GRADIENT } from '@/lib/ui/kxListingPlaceholder';
import {
  difficultyLevels,
  gameTypes,
  type GameDifficulty,
  type GameStatus,
  type GameType,
} from '@/lib/games/games';
import {
  readGamePromoListingsForWallet,
  saveGamePromoListing,
  deleteGamePromoListing,
  type GamePromoListing,
} from '@/lib/games/promoListings';

const BASE_FEE_KAS = 25;
const PREMIUM_MODULE_FEE_KAS = 10;
/** Edit / update action fee (same pattern as dApps directory listings). */
const GAMES_LISTING_ACTION_FEE_KAS = 1;
const FEATURED_IMAGE_MAX_SIZE_MB = 5;

const GAME_CATEGORY_OPTIONS = [
  'Economy',
  'Mining',
  'Lore',
  'Puzzles',
  'Vaults',
  'Strategy',
  'Defense',
  'Trivia',
  'Chronicles',
  'Skill',
  'Training',
  'Crafting',
  'Arcade',
  'Multiplayer',
].map((c) => ({ value: c, label: c }));

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'beta', label: 'Beta' },
  { value: 'active', label: 'Active' },
  { value: 'coming-soon', label: 'Coming soon' },
  { value: 'maintenance', label: 'Maintenance' },
];

function FeaturedImageSourceToggle({
  value,
  onChange,
}: {
  value: 'url' | 'file';
  onChange: (next: 'url' | 'file') => void;
}) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={[
        { value: 'url', label: 'Via URL' },
        { value: 'file', label: 'Upload (IPFS)' },
      ]}
      ariaLabel="Featured image source"
      fullWidth
    />
  );
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,#]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export default function GamesDashboardPage() {
  const { state } = useKaspaWallet();
  const { payActionFee, isProcessing, error, setError } = useDAppListingPayment();
  const { upload, isUploading } = useIPFSUpload();
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const { confirm, alert } = useKxSystemDialog();
  const [tab, setTab] = useState<'create' | 'listings'>('create');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [content, setContent] = useState('');
  const [instructions, setInstructions] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageSource, setFeaturedImageSource] = useState<'url' | 'file'>('url');
  const [featuredImageCid, setFeaturedImageCid] = useState<string | null>(null);
  const [featuredImageName, setFeaturedImageName] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>('strategy');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [gameStatus, setGameStatus] = useState<GameStatus>('beta');
  const [entryCostKAS, setEntryCostKAS] = useState('0');
  const [version, setVersion] = useState('0.1.0');
  const [gameUrl, setGameUrl] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [tagsRaw, setTagsRaw] = useState('');
  const [boostEnabled, setBoostEnabled] = useState(false);
  const [listingsVersion, setListingsVersion] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const listings = useMemo(
    () => readGamePromoListingsForWallet(state.address),
    [state.address, listingsVersion],
  );
  const tags = useMemo(() => parseTags(tagsRaw), [tagsRaw]);
  const earnPoints = useMemo(
    () => computeEarnedHubPoints(HUB_EARN_POINTS.gamesPromoList, krexTier),
    [krexTier],
  );

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
          slug: slug.trim() || slugify(title),
          shortDescription: shortDescription.trim(),
          content: htmlToPlainText(content).trim(),
          instructions: instructions.trim(),
          featuredImageUrl: featuredImageUrl.trim(),
          featuredImageCid,
          gameType,
          difficulty,
          status: gameStatus,
          entryCostKAS: Number(entryCostKAS) || 0,
          version: version.trim(),
          gameUrl: gameUrl.trim(),
          categories,
          tags,
          featuredPlacementEnabled: boostEnabled,
        },
      }),
    [
      krexTier,
      moduleLines,
      title,
      slug,
      shortDescription,
      content,
      instructions,
      featuredImageUrl,
      featuredImageCid,
      gameType,
      difficulty,
      gameStatus,
      entryCostKAS,
      version,
      gameUrl,
      categories,
      tags,
      boostEnabled,
    ],
  );

  const canSubmit = Boolean(
    state.isConnected &&
      state.address &&
      title.trim().length >= HUB_FORM_LIMITS.title.min &&
      slug.trim().length >= HUB_FORM_LIMITS.slug.min &&
      shortDescription.trim().length >= HUB_FORM_LIMITS.shortDescription.min &&
      !isProcessing &&
      !isUploading,
  );

  const uploadFeaturedImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = FEATURED_IMAGE_MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Featured image must be under ${FEATURED_IMAGE_MAX_SIZE_MB}MB`);
      e.target.value = '';
      return;
    }
    try {
      const cid = await upload(file, { filename: file.name });
      if (cid) {
        setFeaturedImageCid(cid);
        setFeaturedImageName(file.name);
        setFeaturedImageUrl(normalizeIpfsUrlForForm(null, cid));
        setFeaturedImageSource('url');
        setError(null);
      } else {
        setError('Failed to upload featured image to IPFS');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload featured image');
    }
    e.target.value = '';
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setShortDescription('');
    setContent('');
    setInstructions('');
    setFeaturedImageUrl('');
    setFeaturedImageCid(null);
    setFeaturedImageName(null);
    setFeaturedImageSource('url');
    setGameType('strategy');
    setDifficulty('medium');
    setGameStatus('beta');
    setEntryCostKAS('0');
    setVersion('0.1.0');
    setGameUrl('');
    setCategories([]);
    setTagsRaw('');
    setBoostEnabled(false);
    setEditingId(null);
  };

  const loadListingIntoForm = (item: GamePromoListing) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSlug(item.slug);
    setShortDescription(item.shortDescription);
    setContent(item.content);
    setInstructions(item.instructions);
    setFeaturedImageUrl(item.featuredImageUrl);
    setFeaturedImageCid(item.featuredImageCid ?? null);
    setFeaturedImageName(null);
    setFeaturedImageSource('url');
    setGameType(item.gameType);
    setDifficulty(item.difficulty);
    setGameStatus(item.status);
    setEntryCostKAS(String(item.entryCostKAS ?? 0));
    setVersion(item.version || '0.1.0');
    setGameUrl(item.gameUrl);
    setCategories(item.categories ?? []);
    setTagsRaw((item.tags ?? []).join(', '));
    setBoostEnabled(false);
    setTab('create');
    window.setTimeout(() => {
      document.getElementById('games-dashboard-create')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleDeleteListing = async (id: string) => {
    const listing = listings.find((x) => x.id === id);
    if (!listing) return;

    if (!state.isConnected || !state.address) {
      await alert({
        title: 'Wallet required',
        message: 'Connect your Kaspa wallet to delete a game listing.',
      });
      return;
    }

    const deleteFeeKas = HUB_DELETE_FEE_KAS_STANDARD;
    const ok = await confirm({
      title: 'Delete game listing',
      message: `Remove "${listing.title}" from Games and your dashboard? A ${deleteFeeKas} KAS fee applies. Uploaded featured images on IPFS will be unpinned.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    try {
      const commitNote = hubListingCommitNote({
        kind: 'games-promo-delete',
        contentHash: listing.id,
        payloadBytes: 0,
        chunkCount: 1,
        totalKas: deleteFeeKas,
      });
      await payActionFee('KAS', deleteFeeKas, commitNote);

      const mediaCids = collectGamesPromoMediaCids(listing);
      if (mediaCids.length) {
        await requestIpfsUnpin(mediaCids);
      }

      deleteGamePromoListing(id);
      if (editingId === id) resetForm();
      setListingsVersion((v) => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game listing');
      await alert({
        title: 'Delete failed',
        message: err instanceof Error ? err.message : 'Failed to delete game listing',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!state.isConnected || !state.address) {
      setError('Connect your Kaspa wallet to publish a game.');
      return;
    }
    if (!title.trim() || !shortDescription.trim()) {
      setError('Title and short description are required.');
      return;
    }

    try {
      const resolvedSlug = slug.trim() || slugify(title);
      const existing = editingId ? listings.find((x) => x.id === editingId) : undefined;

      // Local updates keep the original fee tx; new publishes pay again.
      let feeTxHash = existing?.feeTxHash;
      let feeAmountKas = existing?.feeAmountKas;
      if (!editingId) {
        const commitNote = hubListingCommitNote({
          kind: 'games-promo',
          contentHash: formQuote.contentHash,
          payloadBytes: formQuote.payloadBytes,
          chunkCount: formQuote.chunkCount,
          totalKas: formQuote.totalKas,
        });
        const paid = await payActionFee('KAS', formQuote.totalKas, commitNote);
        feeTxHash = extractKaspaTransactionId(paid) ?? paid;
        feeAmountKas = formQuote.totalKas;
      }

      saveGamePromoListing({
        id: editingId ?? `game-${Date.now()}`,
        wallet: state.address,
        title: title.trim(),
        slug: resolvedSlug,
        shortDescription: shortDescription.trim(),
        content: content.trim(),
        instructions: instructions.trim(),
        featuredImageUrl: featuredImageUrl.trim(),
        featuredImageCid,
        gameType,
        difficulty,
        status: gameStatus,
        entryCostKAS: Number(entryCostKAS) || 0,
        version: version.trim(),
        gameUrl: gameUrl.trim(),
        categories,
        tags,
        listingStatus: 'published',
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        feeTxHash,
        feeAmountKas,
      });

      if (!editingId && feeTxHash) {
        const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;
        creditHubListingEarn({
          walletRaw: state.address,
          source: 'games_promo_list',
          redeemableDelta: HUB_EARN_POINTS.gamesPromoList,
          krexBalance,
          krexTier,
          idempotencyKey: `games:promo:${txNorm}`,
          txHash: txNorm,
          meta: { title: title.trim(), slug: resolvedSlug },
        });
      }

      resetForm();
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
            backLink={{ href: '/games', label: 'Back to Games' }}
            onSectionNav={(sectionId, anchor) => {
              setTab(sectionId === 'listings' ? 'listings' : 'create');
              window.setTimeout(() => {
                document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 80);
            }}
          />
        </div>

        <section className="flex-1 border-l border-zinc-200 p-4 sm:p-6 lg:p-10 dark:border-zinc-800">
          <HubDashboardPageHeader
            kicker="Games dashboard"
            title="Games"
            titleAccent="Studio"
            excerpt="Create and list games with the same fields the public game template uses: media, metadata, and Hub pricing."
            adSlotId="HALO_GAMES_RIGHT"
          />

          <div className={`${KX_DASHBOARD_TAB_SHELL} mb-8 flex-wrap`}>
            {([
              { id: 'create' as const, label: 'List a Game' },
              { id: 'listings' as const, label: 'My Listings' },
            ]).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`${KX_DASHBOARD_TAB_BTN} ${tab === item.id ? KX_DASHBOARD_TAB_BTN_ACTIVE : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'create' ? (
            <div id="games-dashboard-pricing" className="mb-8 scroll-mt-24 grid grid-cols-1 gap-4 md:grid-cols-3">
              <VBlogFeeCard
                title="Listing Fee"
                feeKas={applyKrexFeeDiscount(BASE_FEE_KAS, krexTier)}
                basePoints={HUB_EARN_POINTS.gamesPromoList}
                tier={krexTier}
                note={
                  krexTierDiscountPercent(krexTier) > 0
                    ? `${krexTierDiscountPercent(krexTier)}% KREX discount applied (base ${BASE_FEE_KAS} KAS). Size fees extra.`
                    : 'Base listing fee before payload size. Hold KREX for tier discounts.'
                }
              />
              <VBlogFeeCard
                title="Edit / Update"
                feeKas={applyKrexFeeDiscount(GAMES_LISTING_ACTION_FEE_KAS, krexTier)}
                tier={krexTier}
              />
              <VBlogFeeCard
                title="Delete Fee"
                feeKas={applyKrexFeeDiscount(HUB_DELETE_FEE_KAS_STANDARD, krexTier)}
                tier={krexTier}
              />
            </div>
          ) : null}

          {tab === 'listings' ? (
            <div id="games-dashboard-listings" className="scroll-mt-24 space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">My game listings</h2>
              </div>
              {listings.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-sm text-zinc-500">
                    No listings yet. Open the List a Game tab to publish your first title.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {listings.map((item) => (
                    <KxListingCard key={item.id} accent="games" className="h-full flex flex-col">
                      <KxListingCardMedia aspectClass="aspect-[16/10]">
                        {item.featuredImageUrl ? (
                          <img
                            src={item.featuredImageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className={`flex h-full w-full items-center justify-center text-sm font-bold uppercase tracking-wide text-zinc-500 ${KX_LISTING_PLACEHOLDER_GRADIENT}`}
                          >
                            {gameTypes[item.gameType]?.name ?? item.gameType}
                          </div>
                        )}
                      </KxListingCardMedia>
                      <KxListingCardBody comfortable className="flex flex-1 flex-col">
                        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-zinc-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          {item.shortDescription}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                            {item.gameType}
                          </span>
                          <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                            {item.status}
                          </span>
                        </div>
                        {item.categories?.length ? (
                          <p className="mt-2 text-xs text-zinc-400">{item.categories.join(' · ')}</p>
                        ) : null}
                        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                          <a
                            href={`/games/${item.slug}`}
                            className="k-control-btn flex-1 justify-center text-center text-sm"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => loadListingIntoForm(item)}
                            className="hub-cta-btn k-control-btn flex-1 justify-center text-sm"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => void handleDeleteListing(item.id)}
                            className="k-control-btn flex-1 justify-center text-sm text-red-600 disabled:opacity-50 dark:text-red-400"
                          >
                            {deletingId === item.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </KxListingCardBody>
                    </KxListingCard>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {tab === 'create' ? (
            <div id="games-dashboard-create" className={`${KX_FORM_GRID} scroll-mt-24`}>
              <div className="flex min-w-0 flex-col gap-6">
                <div className={`${KX_FORM_PANEL} space-y-6`}>
                  <div>
                    <DAppSectionHeader title="Main content" className="mb-3" />
                    <h3 className="mb-4 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      {editingId ? 'Edit Game' : 'List a Game'}
                    </h3>
                    <p className="kx-body">
                      Fields map to the public game template (halo header, metadata panel). Estimated
                      cost: {formQuote.totalKas} KAS ({formQuote.chunkCount} chunks, {formQuote.payloadBytes} bytes)
                      {formQuote.discountKas > 0 ? ' (KREX holder discount)' : ''}.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <KxFormFieldLabel required>Game title</KxFormFieldLabel>
                      <KxFieldCharCount
                        value={title}
                        max={HUB_FORM_LIMITS.title.max}
                        min={HUB_FORM_LIMITS.title.min}
                      />
                    </div>
                    <input
                      className="k-input"
                      value={title}
                      maxLength={HUB_FORM_LIMITS.title.max}
                      onChange={(e) => {
                        const next = e.target.value;
                        setTitle(next);
                        if (!slug || slug === slugify(title)) setSlug(slugify(next));
                      }}
                      placeholder="Minecore"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <KxFormFieldLabel required>URL slug</KxFormFieldLabel>
                      <KxFieldCharCount
                        value={slug}
                        max={HUB_FORM_LIMITS.slug.max}
                        min={HUB_FORM_LIMITS.slug.min}
                      />
                    </div>
                    <input
                      className="k-input"
                      value={slug}
                      maxLength={HUB_FORM_LIMITS.slug.max}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="minecore"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <KxFormFieldLabel required>Short description</KxFormFieldLabel>
                      <KxFieldCharCount
                        value={shortDescription}
                        max={HUB_FORM_LIMITS.shortDescription.max}
                        min={HUB_FORM_LIMITS.shortDescription.min}
                      />
                    </div>
                    <textarea
                      className="k-textarea min-h-[90px]"
                      value={shortDescription}
                      maxLength={HUB_FORM_LIMITS.shortDescription.max}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="One or two sentences for cards and the game halo"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <KxFormFieldLabel required>Full description</KxFormFieldLabel>
                      <KxFieldCharCount
                        value={htmlToPlainText(content)}
                        max={HUB_FORM_LIMITS.content.max}
                        min={HUB_FORM_LIMITS.content.min}
                      />
                    </div>
                    <KxRichTextEditor
                      value={content}
                      onChange={setContent}
                      minRows={10}
                      maxLength={HUB_FORM_LIMITS.content.max}
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <KxFormFieldLabel>How to play / instructions</KxFormFieldLabel>
                      <KxFieldCharCount value={instructions} max={HUB_FORM_LIMITS.instructions.max} />
                    </div>
                    <textarea
                      className="k-textarea min-h-[100px]"
                      value={instructions}
                      maxLength={HUB_FORM_LIMITS.instructions.max}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Connect wallet, unlock a slot, start a run…"
                    />
                  </div>

                  <div>
                    <KxFormFieldLabel>Featured image</KxFormFieldLabel>
                    <div className="space-y-3">
                      <FeaturedImageSourceToggle
                        value={featuredImageSource}
                        onChange={setFeaturedImageSource}
                      />
                      {featuredImageSource === 'url' ? (
                        <input
                          type="url"
                          className="k-input"
                          value={featuredImageUrl}
                          onChange={(e) => {
                            setFeaturedImageUrl(normalizeIpfsUrlForForm(e.target.value));
                            setFeaturedImageCid(null);
                            setFeaturedImageName(null);
                          }}
                          placeholder="https://… or ipfs://…"
                        />
                      ) : (
                        <StoreFileUpload
                          label=""
                          hint={`PNG, JPG, or WebP under ${FEATURED_IMAGE_MAX_SIZE_MB} MB`}
                          accept="image/*"
                          fileName={
                            featuredImageName ??
                            (featuredImageCid && !featuredImageName ? 'Uploaded featured image' : null)
                          }
                          onClear={() => {
                            setFeaturedImageCid(null);
                            setFeaturedImageName(null);
                            setFeaturedImageUrl('');
                          }}
                          onChange={uploadFeaturedImage}
                          disabled={isUploading}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <KxFormFieldLabel required>Game type</KxFormFieldLabel>
                      <KxFilterDropdown
                        value={gameType}
                        onChange={(v) => setGameType(v as GameType)}
                        options={(Object.keys(gameTypes) as GameType[]).map((id) => ({
                          value: id,
                          label: gameTypes[id].name,
                        }))}
                        ariaLabel="Game type"
                        triggerClassName="k-field-trigger w-full min-w-0"
                        menuClassName="w-full min-w-[12rem]"
                      />
                    </div>
                    <div>
                      <KxFormFieldLabel required>Difficulty</KxFormFieldLabel>
                      <KxFilterDropdown
                        value={difficulty}
                        onChange={(v) => setDifficulty(v as GameDifficulty)}
                        options={(Object.keys(difficultyLevels) as GameDifficulty[]).map((id) => ({
                          value: id,
                          label: difficultyLevels[id].name,
                        }))}
                        ariaLabel="Difficulty"
                        triggerClassName="k-field-trigger w-full min-w-0"
                        menuClassName="w-full min-w-[12rem]"
                      />
                    </div>
                    <div>
                      <KxFormFieldLabel required>Status</KxFormFieldLabel>
                      <KxFilterDropdown
                        value={gameStatus}
                        onChange={(v) => setGameStatus(v as GameStatus)}
                        options={STATUS_OPTIONS}
                        ariaLabel="Game status"
                        triggerClassName="k-field-trigger w-full min-w-0"
                        menuClassName="w-full min-w-[12rem]"
                      />
                    </div>
                    <div>
                      <KxFormFieldLabel>Entry cost (KAS)</KxFormFieldLabel>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="k-input"
                        value={entryCostKAS}
                        onChange={(e) => setEntryCostKAS(e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <KxFormFieldLabel>Version</KxFormFieldLabel>
                        <KxFieldCharCount value={version} max={HUB_FORM_LIMITS.version.max} />
                      </div>
                      <input
                        className="k-input"
                        value={version}
                        maxLength={HUB_FORM_LIMITS.version.max}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="0.1.0"
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <KxFormFieldLabel>Game URL / embed</KxFormFieldLabel>
                        <KxFieldCharCount value={gameUrl} max={HUB_FORM_LIMITS.url.max} />
                      </div>
                      <input
                        type="url"
                        className="k-input"
                        value={gameUrl}
                        maxLength={HUB_FORM_LIMITS.url.max}
                        onChange={(e) => setGameUrl(e.target.value)}
                        placeholder="https://…"
                      />
                    </div>
                  </div>

                  <div>
                    <KxFormFieldLabel>Categories</KxFormFieldLabel>
                    <KxMultiSelectDropdown
                      values={categories}
                      onChange={setCategories}
                      options={GAME_CATEGORY_OPTIONS}
                      ariaLabel="Game categories"
                      placeholder="Select categories"
                      triggerClassName="k-field-trigger h-10 w-full min-w-0"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Shown on the game halo badges and Metadata panel.
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <KxFormFieldLabel>Tags</KxFormFieldLabel>
                      <KxFieldCharCount value={tagsRaw} max={HUB_FORM_LIMITS.tags.max} />
                    </div>
                    <input
                      className="k-input"
                      value={tagsRaw}
                      maxLength={HUB_FORM_LIMITS.tags.max}
                      onChange={(e) => setTagsRaw(e.target.value)}
                      placeholder="Timers, Refine, GRID (comma separated)"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Wired to the Metadata panel and halo chips (max 12).
                    </p>
                  </div>
                </div>

                <div
                  id="games-dashboard-modules"
                  className={`${KX_FORM_PANEL} my-2 scroll-mt-24 space-y-6 py-10 sm:py-12`}
                >
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
                      <div className="mt-5 border-t border-zinc-200 pt-5 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Featured module is active and included in the calculation breakdown.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <HubAsideRail adSlotId="HALO_GAMES_RIGHT" adId="ad-slot-games-listing-form-rail">
                <HubBenefitsPanel variant="panel" scope="gamesListing" />
                <aside className={KX_CALCULATION_ASIDE}>
                  <HubListingCalculationBreakdown
                    quote={formQuote}
                    hubPoints={earnPoints}
                    footerNote="One Kaspa L1 payment covers the listing, payload size, and any enabled modules."
                  />

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
                    {isProcessing || isUploading
                      ? 'Processing...'
                      : editingId
                        ? 'Update listing'
                        : 'Publish Game'}
                  </button>
                  <HubFlowProgress steps={getHubFlowPreset('hubPublish')} busy={isProcessing || isUploading} />
                </aside>
                </HubAsideRail>
            </div>
          ) : null}
        </section>
      </HubAccentScope>
      <Footer />
    </div>
  );
}
