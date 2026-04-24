'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GamePayment } from '@/components/games/GamePayment';
import { KrexBoosterCard } from '@/components/games/boosters/KrexBoosterCard';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useKrexBoosters } from '@/hooks/useKrexBoosters';
import { RewardsPreview } from '@/components/games/modules/RewardsPreview';
import { useWalletDeck } from '@/hooks/useWalletDeck';
import { StatusDot } from '@/components/ui/StatusDot';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { GameDeckPanel } from '@/components/games/panels/GameDeckPanel';
import { GameTabs } from '@/components/games/layout/GameTabs';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { GameInteractionsPanel } from '@/components/games/panels/GameInteractionsPanel';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GameFeaturedPanel } from '@/components/games/panels/GameFeaturedPanel';

const CommentsSection = dynamic(() => import('@/components/vblog/CommentsSection').then((m) => m.CommentsSection), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      Loading comments…
    </div>
  ),
});

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'play', label: 'Play' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'boosters', label: 'Boosters' },
  { id: 'comments', label: 'Comments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type Target = { id: string; x: number; y: number; r: number; ttlMs: number; createdAt: number };

export function PrecisionClickDashboard(props: { featuredImage?: string; loreStory?: string; gameDescription?: string; gameName?: string; game: any }) {
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult, isActive: krexBoostActive, until: krexBoostUntil, txHash: krexBoostTx } = useKrexBoosters('precision-click');
  const { data: deck, isLoading: deckLoading } = useWalletDeck();

  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  const tierMult = tier === 'Tier4' ? 1.25 : tier === 'Tier3' ? 1.15 : tier === 'Tier2' ? 1.1 : 1;
  const booster = tierMult * (hasAnyNFT ? 1.05 : 1) * krexBoosterMult;

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<TabId>('play');
  const [running, setRunning] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(30_000);

  const loreLines = useMemo(
    () => [
      'A Null Gang glyph flickers on the wall…',
      'Krex’s visor highlights a weak signal trace.',
      'ARIA’s fragment pulses — lock it precisely.',
      'Vector’s calibration drifts. Click with intent.',
      'Tessa marks a stealth window. No wasted motion.',
    ],
    []
  );
  const [lore, setLore] = useState(loreLines[0]!);

  const connections = (props.game?.connections ?? []) as Array<{ toSlug?: string; toHref?: string; title: string; punch: string; requirement?: string }>;
  const categories = (props.game?.categories ?? []) as string[];
  const tags = (props.game?.tags ?? []) as string[];

  const pendingGrid = deck?.rewards?.pendingGrid ?? 0;
  const rewardsTone = deckLoading ? 'info' : pendingGrid > 0 ? 'ok' : 'info';
  const rewardsTip = deckLoading ? 'Checking your unified deck…' : pendingGrid > 0 ? 'You have pending GRID in your unified deck.' : 'No pending GRID right now.';
  const boostersTone = (krexBoosterMult > 1 || tier !== 'Tier0' || hasAnyNFT) ? 'ok' : 'warn';
  const boostersTip = boostersTone === 'ok' ? 'Boosters active (tier/deck/booster).' : 'Boosters available: add KREX tier, deck NFTs, or a KREX booster.';

  const tabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: <span>≡</span> },
      { id: 'play' as const, label: 'Play', icon: <span>▶</span> },
      { id: 'rewards' as const, label: 'Rewards', icon: <span>★</span>, rightAdornment: <StatusDot tone={rewardsTone as any} tooltip={rewardsTip} /> },
      { id: 'boosters' as const, label: 'Boosters', icon: <span>⚡</span>, rightAdornment: <StatusDot tone={boostersTone as any} tooltip={boostersTip} /> },
      { id: 'comments' as const, label: 'Comments', icon: <span>💬</span> },
    ],
    [boostersTip, boostersTone, rewardsTip, rewardsTone]
  );

  function spawnTarget() {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 18;
    const w = Math.max(200, rect.width);
    const h = Math.max(240, rect.height);
    const r = 16 + Math.floor(Math.random() * 18);
    const x = pad + r + Math.random() * (w - (pad + r) * 2);
    const y = pad + r + Math.random() * (h - (pad + r) * 2);
    const ttlMs = 900 + Math.floor(Math.random() * 900);
    const createdAt = Date.now();
    const id = `${createdAt}_${Math.random().toString(16).slice(2)}`;
    setTargets((t) => [...t, { id, x, y, r, ttlMs, createdAt }]);
  }

  useEffect(() => {
    if (!running) return;
    setTargets([]);
    setHits(0);
    setMisses(0);
    setScore(0);
    setTimeLeftMs(30_000);
    setLore(loreLines[0]!);

    const tick = setInterval(() => {
      setTimeLeftMs((ms) => Math.max(0, ms - 100));
      setTargets((t) => {
        const now = Date.now();
        const alive: Target[] = [];
        let expired = 0;
        for (const a of t) {
          if (now - a.createdAt > a.ttlMs) expired++;
          else alive.push(a);
        }
        if (expired > 0) setMisses((m) => m + expired);
        return alive;
      });
    }, 100);

    const spawner = setInterval(() => {
      spawnTarget();
      if (Math.random() < 0.25) spawnTarget();
    }, 600);

    const loreTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * loreLines.length);
      setLore(loreLines[idx]!);
    }, 2500);

    return () => {
      clearInterval(tick);
      clearInterval(spawner);
      clearInterval(loreTimer);
    };
  }, [running, loreLines]);

  useEffect(() => {
    if (!running) return;
    if (timeLeftMs <= 0) setRunning(false);
  }, [timeLeftMs, running]);

  return (
    <TooltipProvider>
    <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col space-y-6 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-base dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">KREX Tier</span>
            <span className="rounded-full border border-zinc-300 bg-zinc-200 px-2 py-0.5 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              {tier}
            </span>
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">Multiplier</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">×{booster.toFixed(2)}</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pay entry on L1 · later claim GRID on L2 via{' '}
            <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
              Rewards &amp; Points
            </Link>
          </p>
        </div>

        <GameTabs tabs={tabs} value={tab} onChange={setTab} />

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Training note</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                ARIA’s fragments don’t wait. The window is small, the noise is loud, and hesitation is a miss. Train the timing until your clicks feel inevitable.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">How to play</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Start a 30s run.</li>
                <li>Hit targets before they fade. Smaller = more points.</li>
                <li>Boosters multiply the final score (tier + deck + optional booster).</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">References</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Browse{' '}
                <Link href="/chronicles/chapters" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                  Chronicles chapters
                </Link>{' '}
                and{' '}
                <Link href="/chronicles/characters" className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                  character dossiers
                </Link>
                .
              </p>
            </div>

            {props.loreStory ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Story</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{props.loreStory}</p>
              </div>
            ) : null}
          </div>
        )}

        {tab === 'boosters' && (
          <div className="space-y-6">
            <KrexBoosterCard gameId="precision-click" title="KREX booster" />
          </div>
        )}

        {tab === 'rewards' && (
          <RewardsPreview showLink={true} />
        )}

        {tab === 'comments' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Community comments</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Share PBs and strategies. Wallet required to post.</p>
            </div>
            <CommentsSection articleId="game:precision-click" />
          </div>
        )}

        {tab === 'play' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">Precision training</p>
                <h3 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">Lock the fragments</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{lore}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Score</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{Math.floor(score * booster)}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Hits: {hits} · Misses: {misses}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Time</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{(timeLeftMs / 1000).toFixed(1)}s</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Hits</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{hits}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Raw</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{score}</p>
              </div>
            </div>

            <div
              ref={arenaRef}
              className="relative mt-5 h-[360px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {!running ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button type="button" className="k-cta-primary h-12 px-6 text-sm" onClick={() => setRunning(true)}>
                    Start 30s run
                  </button>
                </div>
              ) : null}

              {targets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-label="Target"
                  className="absolute rounded-full border border-emerald-500/40 bg-emerald-500/30 transition-colors hover:bg-emerald-500/40"
                  style={{ left: t.x - t.r, top: t.y - t.r, width: t.r * 2, height: t.r * 2 }}
                  onClick={() => {
                    setTargets((all) => all.filter((x) => x.id !== t.id));
                    setHits((h) => h + 1);
                    setScore((s) => s + Math.max(10, Math.floor(60 - t.r)));
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-4">
        <GameDeckPanel
          resources={[
            {
              id: 'grid',
              label: 'GRID (pending)',
              value: pendingGrid.toLocaleString(),
              hint: 'Unified deck rewards',
              accent: 'grid',
              onClick: () => setTab('rewards'),
            },
            {
              id: 'tier',
              label: 'KREX Tier',
              value: tier,
              hint: 'Tier perks',
              accent: 'krex',
              onClick: () => setTab('boosters'),
            },
            {
              id: 'mult',
              label: 'Multiplier',
              value: `×${booster.toFixed(2)}`,
              hint: 'Tier + deck + booster',
              accent: 'games',
              onClick: () => setTab('boosters'),
            },
          ]}
        />

        <GameMetadataPanel categories={categories} tags={tags} />
        <GameInteractionsPanel interactions={connections} />
        <GamePurchasesPanel>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {krexBoostActive && krexBoostUntil ? (
              <div className="space-y-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">KREX booster active</p>
                <p className="text-xs">Ends at {new Date(krexBoostUntil).toLocaleString()}</p>
                {krexBoostTx ? <p className="text-xs font-mono text-zinc-500 dark:text-zinc-500">{krexBoostTx.slice(0, 10)}…{krexBoostTx.slice(-8)}</p> : null}
              </div>
            ) : (
              <p className="text-xs">No active purchases yet.</p>
            )}
          </div>
        </GamePurchasesPanel>

        <GameFeaturedPanel
          featuredImage={props.featuredImage}
          title={props.gameName ?? 'Precision Click'}
          description={props.gameDescription}
          loreStory={props.loreStory}
        />

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Entry</h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Pay once to begin training runs.</p>
          <GamePayment game={props.game} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="p-4">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">FAQ</p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Boosters are optional. Rewards are unified via the Kasparex deck.</p>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}

