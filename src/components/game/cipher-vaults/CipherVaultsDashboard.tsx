'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCipherVaults } from '@/hooks/useCipherVaults';
import { CIPHER_TICKET_REDEEM_RATE_POINTS, CIPHER_VAULTS_TREASURY_ADDRESS, CIPHER_VAULT_TIERS, type CipherVaultTierId } from '@/lib/game/cipher-vaults-config';
import { CipherGridLockedPreview } from './CipherGridLockedPreview';
import { CipherGridPuzzle } from './CipherGridPuzzle';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import dynamic from 'next/dynamic';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';
import { GamesWithSidebarLayout } from '@/components/games/layout/GamesWithSidebarLayout';
import { GamesHaloHeader } from '@/components/games/GamesHaloHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { GameInteractionsPanel } from '@/components/games/panels/GameInteractionsPanel';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GamesPlayAdRail } from '@/components/games/GamesPlayAdRail';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { IconComments, IconOverview, IconRedeem, IconRewards, IconVaults } from '@/components/games/icons/TabIcons';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { GamesAdaptiveGrid } from '@/components/games/layout/GamesAdaptiveGrid';
import { useGameCommentsTabs, gameCommentsArticleId } from '@/components/games/comments/gameComments';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'vaults', label: 'Vaults' },
  { id: 'redeem', label: 'Redeem' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'comments', label: 'Comments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const CommentsSection = dynamic(() => import('@/components/vblog/CommentsSection').then((m) => m.CommentsSection), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      Loading comments…
    </div>
  ),
});

export function CipherVaultsDashboard({
  featuredImage = '',
  loreStory = '',
  gameDescription = '',
  game,
  gameName,
}: { featuredImage?: string; loreStory?: string; gameDescription?: string; game?: any; gameName?: string }) {
  const { state: walletState } = useKaspaWallet();
  const { state, tickets, canPayWithL1, startRun, submitRun, loadActiveRun, cancelRun, redeemRefinement, fetchDiamondVeinsRefinementPoints } = useCipherVaults();
  const categories = (game?.categories ?? []) as string[];
  const tags = (game?.tags ?? []) as string[];
  const interactions = (game?.connections ?? []) as Array<{ toSlug?: string; toHref?: string; title: string; punch: string; requirement?: string }>;

  const [tab, setTab] = useState<TabId>('vaults');
  const [tierId, setTierId] = useState<CipherVaultTierId>('t1');
  const [payWith, setPayWith] = useState<'KAS' | 'TICKET'>('KAS');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [puzzle, setPuzzle] = useState<{ size: number; initial: number[]; target: number[]; moveLimit: number } | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [redeemablePoints, setRedeemablePoints] = useState(0);
  const [redeemAmount, setRedeemAmount] = useState(CIPHER_TICKET_REDEEM_RATE_POINTS);
  const [toast, setToast] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const haloGame = game
    ? {
        ...game,
        categories: (game as { categories?: string[] }).categories ?? categories,
        tags: (game as { tags?: string[] }).tags ?? tags,
      }
    : {
        name: gameName || 'Cipher Vaults',
        description: gameDescription || '',
        developer: 'Kasparex',
        status: 'active' as const,
        difficulty: 'medium' as const,
        gameType: 'puzzle' as const,
        featuredImage,
        image: featuredImage,
        entryCostKAS: 0,
        publisher: 'kasparex' as const,
        categories,
        tags,
      };

  useEffect(() => {
    if (!walletState.isConnected) return;
    void fetchDiamondVeinsRefinementPoints().then((pts) => setRedeemablePoints(pts));
  }, [walletState.isConnected, fetchDiamondVeinsRefinementPoints, state.version]);

  /** Always mirror server /run/current while on Vaults so UI never disagrees with “already active” errors. */
  useEffect(() => {
    if (!walletState.isConnected || walletState.address == null || tab !== 'vaults') return;
    let cancelled = false;
    void (async () => {
      try {
        const cur = await loadActiveRun();
        if (cancelled) return;
        if (cur?.run?.runId && cur?.puzzle) {
          setActiveRunId(cur.run.runId);
          setPuzzle(cur.puzzle);
        } else {
          setActiveRunId(null);
          setPuzzle(null);
        }
      } catch {
        if (!cancelled) {
          setActiveRunId(null);
          setPuzzle(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletState.isConnected, walletState.address, tab, loadActiveRun]);

  const redeemableRemaining = Math.max(0, redeemablePoints - (state.redeemedRefinementPointsTotal ?? 0));

  /** Authoritative: hook state tracks server activeRun; puzzle mirrors GET /run/current */
  const hasActiveRunOnServer = Boolean(state.activeRun);
  const canPlayGrid = Boolean(puzzle && activeRunId);
  const runIdForActions = activeRunId ?? state.activeRun?.runId ?? null;

  const tier = useMemo(() => CIPHER_VAULT_TIERS.find((t) => t.id === tierId)!, [tierId]);
  const openOverview = () => {
    setTab('overview');
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // ignore
    }
  };

  const baseTabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: <IconOverview /> },
      { id: 'vaults' as const, label: 'Vaults', icon: <IconVaults /> },
      { id: 'redeem' as const, label: 'Redeem', icon: <IconRedeem /> },
      { id: 'rewards' as const, label: 'Rewards', icon: <IconRewards /> },
      { id: 'comments' as const, label: 'Comments', icon: <IconComments /> },
    ],
    [],
  );
  const tabs = useGameCommentsTabs(baseTabs, 'cipher-vaults');

  const deckResources: GameDeckResource[] = [
    {
      id: 'tickets',
      label: 'In-game currency',
      value: tickets.available.toLocaleString(),
      subValue: 'Cipher Tickets',
      description: 'Run entry tickets',
      tooltip: 'Entry tickets you can spend instead of KAS to start runs. Click to open Redeem.',
      accent: 'games',
      onClick: () => setTab('redeem'),
    },
    {
      id: 'refinement',
      label: 'Redeem points',
      value: redeemableRemaining.toLocaleString(),
      description: 'From Diamond Veins refinement',
      tooltip: `Mine diamonds, convert them into refinement points, and redeem tickets to enter Cipher Vaults without paying KAS. (${CIPHER_TICKET_REDEEM_RATE_POINTS} pts = 1 ticket). Click to open Redeem.`,
      accent: 'diamonds',
      onClick: () => setTab('redeem'),
    },
  ];

  return (
    <TooltipProvider>
    <GamesWithSidebarLayout
      tabs={tabs}
      currentTab={tab}
      onTabChange={setTab}
      haloHeader={
        <GamesHaloHeader
          game={haloGame}
          resources={deckResources}
          deckFooter="Values update live as you earn tickets and clear vaults."
        />
      }
      main={
        <>
        {toast && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            {toast}
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-6">
            <GamePanelCard title="How to play" hint="Run → solve → checkpoint.">
              <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>Start a vault run by paying with KAS or spending a Cipher Ticket.</li>
                <li>Solve the Cipher Grid within the move limit - each swap counts as one move.</li>
                <li>A verified clear records a checkpoint, contributing to future GRID distribution.</li>
                <li>Earn Cipher Tickets by redeeming Diamond Veins refinement points ({CIPHER_TICKET_REDEEM_RATE_POINTS} pts = 1 ticket).</li>
              </ul>
            </GamePanelCard>

            <GamePanelCard title="Diamond Veins bridge" hint="Convert refinement points into tickets.">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Redeem Diamond Veins <strong>refinement points</strong> into Cipher Tickets: <strong>{CIPHER_TICKET_REDEEM_RATE_POINTS} pts</strong> = <strong>1 ticket</strong>.
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Need points? Start mining in{' '}
                <Link href="/games/diamond-veins" className="font-semibold text-emerald-700 underline dark:text-emerald-300">
                  Diamond Veins
                </Link>
                .
              </p>
            </GamePanelCard>

            <GameOverviewSections
              gameName={gameName ?? "Krex's Cipher Vaults"}
              description={gameDescription}
              loreStory={loreStory}
              featuredImage={featuredImage || undefined}
              flow={[
                'Start a vault run (KAS or a Cipher Ticket).',
                'Solve the Cipher Grid within the move limit to clear a vault.',
                'Clears record checkpoints and contribute to later GRID distribution.',
                'Redeem refinement points into tickets via the Redeem tab.',
              ]}
            />
          </div>
        )}

        {tab === 'vaults' && (
          <div className="space-y-6">
            <GamesAdaptiveGrid gapClass="gap-3">
              {CIPHER_VAULT_TIERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    tierId === t.id
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.label}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Move limit: {t.moveLimit}</p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    Entry: <strong>{t.entryKAS}</strong> KAS
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Preview: {t.gridPreview} GRID · {10 * (t.gridPreview ?? 1)} pts</p>
                </button>
              ))}
            </GamesAdaptiveGrid>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-2">
                    Start a run
                    <Tooltip
                      content={gameTooltipRich(
                        'Start a run',
                        'Creates one active attempt at a time. If you already have an active run, end it first to avoid duplicate payments.',
                      )}
                    >
                      <button
                        type="button"
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
                        aria-label="About starting runs"
                      >
                        i
                      </button>
                    </Tooltip>
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">Pay with KAS or spend 1 ticket.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={payWith}
                    onChange={(e) => setPayWith(e.target.value === 'TICKET' ? 'TICKET' : 'KAS')}
                    className="h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    disabled={hasActiveRunOnServer}
                  >
                    <option value="KAS">Pay with KAS</option>
                    <option value="TICKET">Use 1 ticket ({tickets.available} avail)</option>
                  </select>
                  <button
                    type="button"
                    disabled={hasActiveRunOnServer || starting || (payWith === 'KAS' && !canPayWithL1)}
                    onClick={async () => {
                      setToast(null);
                      setStarting(true);
                      try {
                        const res = await startRun(tierId, payWith);
                        setPuzzle(res.puzzle);
                        setActiveRunId(res.run.runId);
                        setToast('Vault run started. Solve the cipher to submit.');
                      } catch (e: any) {
                        setToast(e?.message || 'Failed to start run');
                      } finally {
                        setStarting(false);
                      }
                    }}
                    className="k-cta-games h-12 px-5 text-sm disabled:opacity-50 disabled:grayscale"
                  >
                    {starting ? 'Starting…' : 'Start run'}
                  </button>
                </div>
              </div>

              {hasActiveRunOnServer && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                  {canPlayGrid ? (
                    <p>You have an active vault run. Submit your solution, or end the run before starting another attempt.</p>
                  ) : (
                    <p>Loading your active vault from the server… If this persists, tap Resume run.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="k-control-btn"
                      onClick={async () => {
                        setToast(null);
                        try {
                          const cur = await loadActiveRun();
                          if (cur?.run?.runId && cur?.puzzle) {
                            setActiveRunId(cur.run.runId);
                            setPuzzle(cur.puzzle);
                            setToast('Loaded your active run.');
                          } else {
                            setToast('No active run found.');
                            setActiveRunId(null);
                            setPuzzle(null);
                          }
                        } catch (e: any) {
                          setToast(e?.message || 'Failed to load run');
                        }
                      }}
                    >
                      Resume run
                    </button>
                    <button
                      type="button"
                      className="k-control-btn"
                      onClick={async () => {
                        setToast(null);
                        try {
                          await cancelRun(runIdForActions ?? undefined);
                          setPuzzle(null);
                          setActiveRunId(null);
                          setToast('Run ended. You can start a new attempt now.');
                        } catch (e: any) {
                          setToast(e?.message || 'Failed to end run');
                        }
                      }}
                    >
                      End run (no refund)
                    </button>
                  </div>
                </div>
              )}

              {payWith === 'KAS' && !canPayWithL1 && (
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Connect with KasWare or Kastle to send L1 KAS entry payments.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
              {canPlayGrid && puzzle ? (
                <>
                  <CipherGridPuzzle
                    size={puzzle.size}
                    initial={puzzle.initial}
                    target={puzzle.target}
                    moveLimit={puzzle.moveLimit}
                    onSolved={async (moves) => {
                      setToast(null);
                      setSubmitting(true);
                      try {
                        const rid = activeRunId ?? state.activeRun?.runId;
                        if (!rid) throw new Error('Missing run id');
                        const res = await submitRun(rid, moves);
                        if (res?.solved) {
                          setToast('Solution verified. Checkpoint recorded.');
                          setPuzzle(null);
                          setActiveRunId(null);
                          setTab('rewards');
                        } else {
                          setToast('Not solved yet (server verification failed).');
                        }
                      } catch (e: any) {
                        setToast(e?.message || 'Submit failed');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    onFailed={() => {
                      void (async () => {
                        setToast(null);
                        try {
                          await cancelRun(activeRunId ?? state.activeRun?.runId ?? undefined);
                        } catch {
                          // ignore
                        } finally {
                          setToast('Out of moves. Start a new paid attempt to try again.');
                          setPuzzle(null);
                          setActiveRunId(null);
                        }
                      })();
                    }}
                  />
                  {submitting && <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">Verifying…</p>}
                </>
              ) : hasActiveRunOnServer && !canPlayGrid ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fetching vault puzzle…</p>
                  <div className="grid animate-pulse gap-3 md:grid-cols-2">
                    <div className="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              ) : (
                <CipherGridLockedPreview />
              )}
            </div>
          </div>
        )}

        {tab === 'redeem' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-2">
                Redeem Diamond Veins refinement
                <Tooltip
                  content={gameTooltipRich(
                    'Redeem refinement',
                    'Tickets are tracked in Cipher Vaults. This V1 flow does not burn points inside Diamond Veins, but each refinement point can only be redeemed once here (redeemed totals are tracked).',
                  )}
                >
                  <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
                    aria-label="About redeeming refinement"
                  >
                    i
                  </button>
                </Tooltip>
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Diamond Veins refinement points: <strong>{redeemablePoints.toLocaleString()}</strong> · Unredeemed: <strong>{redeemableRemaining.toLocaleString()}</strong>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Tickets earned are tracked inside Cipher Vaults. This V1 redemption does not burn points in Diamond Veins yet.
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Earn refinement points by playing{' '}
                <Link href="/games/diamond-veins" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
                  Diamond Veins
                </Link>
                .
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={CIPHER_TICKET_REDEEM_RATE_POINTS}
                  step={CIPHER_TICKET_REDEEM_RATE_POINTS}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(Math.max(CIPHER_TICKET_REDEEM_RATE_POINTS, Math.floor(Number(e.target.value) || 0)))}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button
                  type="button"
                  className="k-cta-games h-11 px-5 text-sm"
                  onClick={async () => {
                    setToast(null);
                    try {
                      const rounded = Math.floor(redeemAmount / CIPHER_TICKET_REDEEM_RATE_POINTS) * CIPHER_TICKET_REDEEM_RATE_POINTS;
                      if (rounded <= 0) throw new Error('Enter a valid amount');
                      if (rounded > redeemableRemaining) throw new Error('Not enough unredeemed refinement points');
                      await redeemRefinement(rounded);
                      const pts = await fetchDiamondVeinsRefinementPoints();
                      setRedeemablePoints(pts);
                      setToast(`Redeemed ${rounded} points into tickets.`);
                    } catch (e: any) {
                      setToast(e?.message || 'Redeem failed');
                    }
                  }}
                >
                  Redeem to tickets
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                Tickets available: <strong className="text-emerald-700 dark:text-emerald-300">{tickets.available}</strong> (total earned: {tickets.total})
              </p>
            </div>
          </div>
        )}

        {tab === 'rewards' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Cipher checkpoints</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your verified clears are recorded as a local+server ledger. Future GRID distribution can use these checkpoints.
              </p>
            </div>
            
            <CardsFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              category={category}
              onCategoryChange={setCategory}
              categories={['t1', 't2', 't3']}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <tr>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">When</th>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Tier</th>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Moves</th>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Entry tx</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let list = [...(state.ledger ?? [])];
                    if (searchQuery) {
                      const q = searchQuery.toLowerCase();
                      list = list.filter(e => e.tierId.toLowerCase().includes(q) || e.entryTxHash?.toLowerCase().includes(q));
                    }
                    if (category !== 'all') {
                      list = list.filter(e => e.tierId === category);
                    }
                    if (sortBy === 'price_asc') {
                      list.sort((a, b) => a.moves - b.moves);
                    } else if (sortBy === 'price_desc') {
                      list.sort((a, b) => b.moves - a.moves);
                    } else {
                      list.sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());
                    }

                    if (list.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                            No clears match your filters.
                          </td>
                        </tr>
                      );
                    }

                    return list.map((e) => (
                      <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="p-3 text-zinc-600 dark:text-zinc-400">{new Date(e.solvedAt).toLocaleString()}</td>
                        <td className="p-3 text-zinc-800 dark:text-zinc-200">{e.tierId}</td>
                        <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                          {e.moves}/{e.moveLimit}
                        </td>
                        <td className="p-3 font-mono text-xs text-zinc-500 dark:text-zinc-500">{e.entryTxHash ? e.entryTxHash.slice(0, 10) + '…' : 'ticket'}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'comments' && (
          <CommentsSection articleId={gameCommentsArticleId('cipher-vaults')} dappSectionHeader />
        )}
        </>
      }
      sidebar={
        <div className="flex flex-col gap-4">
        <HubBenefitsPanel variant="panel" scope="games" className="w-full" />

        <GameInteractionsPanel interactions={interactions} />

        <GamePurchasesPanel>
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Entry</div>
            <div className="mt-1 text-[11px]">Pay with KAS or use tickets. One active run at a time.</div>
          </div>
        </GamePurchasesPanel>

        <GameMetadataPanel categories={categories} tags={tags} />

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setFaqOpen((o) => !o)}
            className="flex w-full items-center justify-between p-4 text-left text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
          >
            FAQ &amp; payouts
            <svg className={`h-5 w-5 transition-transform ${faqOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {faqOpen && (
            <div className="space-y-3 border-t border-zinc-200 px-4 pb-4 pt-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">What am I earning?</p>
                <p className="mt-1">
                  This demo records checkpoints (runs + clears). GRID distribution is handled elsewhere on Kasplex L2. The ledger here is your audit trail.
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">Tickets</p>
                <p className="mt-1">
                  Redeem Diamond Veins refinement points into Cipher Tickets. Tickets let you enter a run without sending KAS.
                </p>
              </div>
            </div>
          )}
        </div>

        <GamesPlayAdRail />
        </div>
      }
    />
    </TooltipProvider>
  );
}

