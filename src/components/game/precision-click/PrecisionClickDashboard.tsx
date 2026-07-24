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
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';
import { GamesWithSidebarLayout } from '@/components/games/layout/GamesWithSidebarLayout';
import { GamesHaloHeader } from '@/components/games/GamesHaloHeader';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';
import { GamesSecurityPanel } from '@/components/games/panels/GamesSecurityPanel';
import { GameMetadataPanel } from '@/components/games/panels/GameMetadataPanel';
import { GamePurchasesPanel } from '@/components/games/panels/GamePurchasesPanel';
import { GamesAsideRail } from '@/components/games/layout/GamesAsideRail';
import { GameOverviewSections } from '@/components/games/panels/GameOverviewSections';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GamesAdaptiveGrid } from '@/components/games/layout/GamesAdaptiveGrid';
import { IconBoosters, IconComments, IconMilestones, IconOverview, IconPlay, IconRewards } from '@/components/games/icons/TabIcons';
import { gameCommentsArticleId } from '@/components/games/comments/gameComments';
import { MilestonesPanel } from '@/components/games/modules/MilestonesPanel';
import { useGameMilestones } from '@/hooks/useGameMilestones';
import { GameActivityStatusDot, type GameActivityHealth } from '@/components/games/GameActivityStatusDot';
import type { GameTab } from '@/components/games/layout/GameTabs';

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
  { id: 'milestones', label: 'Milestones' },
  { id: 'boosters', label: 'Boosters' },
  { id: 'comments', label: 'Comments' },
] as const;

type TabId = (typeof TABS)[number]['id'];

type Target = { id: string; x: number; y: number; r: number; ttlMs: number; createdAt: number };

export function PrecisionClickDashboard(props: { featuredImage?: string; loreStory?: string; gameDescription?: string; gameName?: string; game: any }) {
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult, isActive: krexBoostActive, until: krexBoostUntil, txHash: krexBoostTx } = useKrexBoosters('precision-click');
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
      'ARIA’s fragment pulses - lock it precisely.',
      'Vector’s calibration drifts. Click with intent.',
      'Tessa marks a stealth window. No wasted motion.',
    ],
    []
  );
  const [lore, setLore] = useState(loreLines[0]!);

  const categories = (props.game?.categories ?? []) as string[];
  const tags = (props.game?.tags ?? []) as string[];

  const playHealth: GameActivityHealth = running
    ? 'active'
    : timeLeftMs <= 0 && (hits > 0 || misses > 0)
      ? 'exhausted'
      : 'inactive';

  const tabs: GameTab<TabId>[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: <IconOverview /> },
      {
        id: 'play',
        label: 'Play',
        icon: <IconPlay />,
        rightAdornment: (
          <GameActivityStatusDot
            health={playHealth}
            title={running ? 'Round active' : playHealth === 'exhausted' ? 'Round finished' : 'Idle'}
          />
        ),
      },
      { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
      { id: 'milestones', label: 'Milestones', icon: <IconMilestones /> },
      { id: 'boosters', label: 'Boosters', icon: <IconBoosters /> },
      { id: 'comments', label: 'Comments', icon: <IconComments /> },
    ],
    [playHealth, running],
  );

  const deckResources: GameDeckResource[] = useMemo(
    () => [
      {
        id: 'score',
        label: 'Score',
        value: (
          <span className="inline-flex items-center gap-2">
            {Math.floor(score * booster).toLocaleString()}
            <GameActivityStatusDot
              health={playHealth}
              title={running ? 'Round active' : playHealth === 'exhausted' ? 'Round finished' : 'Idle'}
            />
          </span>
        ),
        description: 'In-game currency',
        subValue: running ? `${Math.ceil(timeLeftMs / 1000)}s left` : hits + misses > 0 ? `${hits} hits` : 'Ready',
        accent: 'games',
        onClick: () => setTab('play'),
      },
    ],
    [score, booster, playHealth, running, timeLeftMs, hits, misses],
  );
  const milestoneProgress = useMemo(
    () => ({ precision_score: Math.max(score, Math.floor(score * booster)) }),
    [score, booster],
  );
  const { level: playerLevel } = useGameMilestones('precision-click', milestoneProgress);

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
    <GamesWithSidebarLayout
      tabs={tabs}
      currentTab={tab}
      onTabChange={setTab}
      haloHeader={
        <GamesHaloHeader
          game={props.game}
          resources={deckResources}
          deckFooter="Values update live as you train and boost."
          playerLevel={playerLevel}
        />
      }
      main={
        <>
        {tab === 'overview' && (
          <div className="space-y-6">
            <GamePanelCard title="Training note" hint="Timing and intent.">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                ARIA’s fragments don’t wait. The window is small, the noise is loud, and hesitation is a miss. Train the timing until your clicks feel inevitable.
              </p>
            </GamePanelCard>

            <GamePanelCard title="How to play" hint="Quick rules.">
              <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>Start a 30s run.</li>
                <li>Hit targets before they fade. Smaller = more points.</li>
                <li>Boosters multiply the final score (tier + deck + optional booster).</li>
              </ul>
            </GamePanelCard>

            <GamePanelCard title="References" hint="Worldbuilding links.">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Browse{' '}
                <Link href="/chronicles/chapters" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                  Chronicles chapters
                </Link>{' '}
                and{' '}
                <Link href="/chronicles/characters" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                  character dossiers
                </Link>
                .
              </p>
            </GamePanelCard>

            <GameOverviewSections
              gameName={props.gameName ?? 'Precision Click'}
              kicker="Game guide"
              subtitle="ARIA Lock reflex training with scored target runs."
              description={props.gameDescription}
              loreStory={props.loreStory}
              tips={[
                {
                  title: 'Accuracy tip',
                  body: 'Smaller targets award more points. Too many misses end the session early, so prioritize precision over raw click speed.',
                },
              ]}
              flow={[
                'Pay the KAS training entry once to unlock play.',
                'Complete timed target sessions and chase a high score.',
                'Optional KREX boosters and NFT deck bonuses multiply your final score.',
                'Claim rewards later via Rewards & Points when Hub pools allow.',
              ]}
            />
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

        {tab === 'milestones' && (
          <MilestonesPanel gameId="precision-click" progress={milestoneProgress} />
        )}

        {tab === 'comments' && (
          <CommentsSection articleId={gameCommentsArticleId('precision-click')} dappSectionHeader />
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

            <GamesAdaptiveGrid gapClass="gap-3" className="mt-5">
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
            </GamesAdaptiveGrid>

            <div
              ref={arenaRef}
              className="relative mt-5 h-[360px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {!running ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button type="button" className="k-cta-games h-12 px-6 text-sm" onClick={() => setRunning(true)}>
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
        </>
      }
      sidebar={
        <GamesAsideRail>
        <HubBenefitsPanel variant="panel" scope="games" className="w-full" />

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
        <GameMetadataPanel categories={categories} tags={tags} />
        <GamesSecurityPanel />

        <GamePanelCard title="Entry" hint="Pay once to begin training runs.">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Pay once to begin training runs.</p>
          <GamePayment game={props.game} />
        </GamePanelCard>

        <GamePanelCard title="FAQ">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Boosters are optional. Rewards are unified via the Kasparex deck.
          </p>
        </GamePanelCard>
        </GamesAsideRail>
      }
    />
    </TooltipProvider>
  );
}

