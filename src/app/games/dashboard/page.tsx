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
import { computeEarnedHubPoints } from '@/lib/rewards/hub-points';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { KxFilterDropdown } from '@/components/ui/KxFilterDropdown';
import { KxMultiSelectDropdown } from '@/components/ui/KxMultiSelectDropdown';
import { StoreFileUpload } from '@/components/store/StoreFileUpload';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { normalizeIpfsUrlForForm } from '@/lib/ipfs/gateway';
import {
  difficultyLevels,
  gameTypes,
  type GameDifficulty,
  type GameStatus,
  type GameType,
} from '@/lib/games/games';

type GamePromoListing = {
  id: string;
  wallet: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  instructions: string;
  featuredImageUrl: string;
  featuredImageCid?: string | null;
  gameType: GameType;
  difficulty: GameDifficulty;
  status: GameStatus;
  entryCostKAS: number;
  version: string;
  gameUrl: string;
  categories: string[];
  tags: string[];
  listingStatus: 'draft' | 'published';
  createdAt: string;
  feeTxHash?: string;
  feeAmountKas?: number;
};

const STORAGE_KEY = 'kasparex_games_dashboard_promotions';
const BASE_FEE_KAS = 25;
const PREMIUM_MODULE_FEE_KAS = 10;
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
  const { upload, isUploading } = useIPFSUpload();
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
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

  const listings = useMemo(() => readListings(state.address), [state.address, listingsVersion]);
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
      title.trim() &&
      shortDescription.trim() &&
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
      const commitNote = hubListingCommitNote({
        kind: 'games-promo',
        contentHash: formQuote.contentHash,
        payloadBytes: formQuote.payloadBytes,
        chunkCount: formQuote.chunkCount,
        totalKas: formQuote.totalKas,
      });
      const feeTxHash = await payActionFee('KAS', formQuote.totalKas, commitNote);
      const txNorm = extractKaspaTransactionId(feeTxHash) ?? feeTxHash;

      saveListing({
        id: `game-${Date.now()}`,
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
        createdAt: new Date().toISOString(),
        feeTxHash: txNorm,
        feeAmountKas: formQuote.totalKas,
      });

      appendHubActivityEarn({
        walletRaw: state.address,
        source: 'games_promo_list',
        redeemableDelta: HUB_EARN_POINTS.gamesPromoList,
        krexBalance,
        idempotencyKey: `games:promo:${txNorm}`,
        meta: { title: title.trim(), slug: resolvedSlug },
      });

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
            backLink={{ href: '/hub', label: 'Back to Hub' }}
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
            meta={
              state.address ? (
                <p className="font-mono text-xs text-zinc-500">{state.address}</p>
              ) : null
            }
          />

          <div className={`${KX_DASHBOARD_TAB_SHELL} mb-8 flex-wrap`}>
            {([
              { id: 'create' as const, label: 'Game' },
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
                feeKas={BASE_FEE_KAS}
                basePoints={HUB_EARN_POINTS.gamesPromoList}
                tier={krexTier}
              />
              <VBlogFeeCard title="Featured module" feeKas={PREMIUM_MODULE_FEE_KAS} tier={krexTier} />
              <VBlogFeeCard
                title="Hub points"
                feeKas={0}
                basePoints={HUB_EARN_POINTS.gamesPromoList}
                tier={krexTier}
                note={`Earn +${earnPoints} pts on publish at your current KREX tier.`}
              />
            </div>
          ) : null}

          {tab === 'listings' ? (
            <div
              id="games-dashboard-listings"
              className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">My game listings</h2>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {listings.length === 0 ? (
                  <p className="p-8 text-sm text-zinc-500">
                    No listings yet. Open the Game tab to publish your first title.
                  </p>
                ) : (
                  listings.map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                        <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                          {item.gameType}
                        </span>
                        <span className="rounded-md border border-zinc-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:border-zinc-700">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{item.shortDescription}</p>
                      {item.categories?.length ? (
                        <p className="mt-2 text-xs text-zinc-400">{item.categories.join(' · ')}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}

          {tab === 'create' ? (
            <div id="games-dashboard-create" className={`${KX_FORM_GRID} scroll-mt-24 items-start`}>
              <div className="flex min-w-0 flex-col gap-6">
                <div className={`${KX_FORM_PANEL} space-y-6`}>
                  <div>
                    <DAppSectionHeader title="Main content" className="mb-3" />
                    <h3 className="mb-4 text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      List a Game
                    </h3>
                    <p className="kx-body">
                      Fields map to the public game template (halo header, metadata panel). Estimated
                      cost: {formQuote.totalKas} KAS ({formQuote.chunkCount} chunks, {formQuote.payloadBytes} bytes)
                      {formQuote.discountKas > 0 ? ' (KREX holder discount)' : ''}.
                    </p>
                  </div>

                  <div>
                    <KxFormFieldLabel required>Game title</KxFormFieldLabel>
                    <input
                      className="k-input"
                      value={title}
                      onChange={(e) => {
                        const next = e.target.value;
                        setTitle(next);
                        if (!slug || slug === slugify(title)) setSlug(slugify(next));
                      }}
                      placeholder="Minecore"
                    />
                  </div>

                  <div>
                    <KxFormFieldLabel>URL slug</KxFormFieldLabel>
                    <input
                      className="k-input"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder="minecore"
                    />
                  </div>

                  <div>
                    <KxFormFieldLabel required>Short description</KxFormFieldLabel>
                    <textarea
                      className="k-textarea min-h-[90px]"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="One or two sentences for cards and the game halo"
                    />
                  </div>

                  <div>
                    <KxFormFieldLabel>Full description</KxFormFieldLabel>
                    <KxRichTextEditor value={content} onChange={setContent} minRows={10} />
                  </div>

                  <div>
                    <KxFormFieldLabel>How to play / instructions</KxFormFieldLabel>
                    <textarea
                      className="k-textarea min-h-[100px]"
                      value={instructions}
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
                        triggerClassName="k-control-btn w-full min-w-0"
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
                        triggerClassName="k-control-btn w-full min-w-0"
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
                        triggerClassName="k-control-btn w-full min-w-0"
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
                      <KxFormFieldLabel>Version</KxFormFieldLabel>
                      <input
                        className="k-input"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="0.1.0"
                      />
                    </div>
                    <div>
                      <KxFormFieldLabel>Game URL / embed</KxFormFieldLabel>
                      <input
                        type="url"
                        className="k-input"
                        value={gameUrl}
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
                      triggerClassName="k-control-btn h-10 w-full min-w-0"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Shown on the game halo badges and Metadata panel.
                    </p>
                  </div>

                  <div>
                    <KxFormFieldLabel>Tags</KxFormFieldLabel>
                    <input
                      className="k-input"
                      value={tagsRaw}
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

              <div className={KX_FORM_STICKY_RAIL}>
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
                    {isProcessing || isUploading ? 'Processing...' : 'Publish Game'}
                  </button>
                  <HubFlowProgress steps={getHubFlowPreset('hubPublish')} busy={isProcessing || isUploading} />
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
