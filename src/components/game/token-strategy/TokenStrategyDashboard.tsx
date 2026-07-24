'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
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
import { IconBoosters, IconComments, IconMilestones, IconOverview, IconPlay, IconRewards } from '@/components/games/icons/TabIcons';
import { gameCommentsArticleId } from '@/components/games/comments/gameComments';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { GamesAdaptiveGrid } from '@/components/games/layout/GamesAdaptiveGrid';
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

type Choice = { id: string; label: string; effect: { security: number; power: number; stealth: number } };
type Mission = { id: string; title: string; narrative: string; choices: Choice[] };

function buildMissions(): Mission[] {
  return [
    {
      id: 'M1',
      title: 'Signal Spike',
      narrative: 'Kasparex detects a spike. Null Gang might be probing the perimeter. Pick your first response.',
      choices: [
        { id: 'c1', label: 'Lock down endpoints', effect: { security: 2, power: 0, stealth: 1 } },
        { id: 'c2', label: 'Trace the payload', effect: { security: 1, power: 1, stealth: 1 } },
        { id: 'c3', label: 'Overclock scanners', effect: { security: 0, power: 2, stealth: 0 } },
      ],
    },
    {
      id: 'M2',
      title: 'Vector’s Patch',
      narrative: 'Vector offers a quick patch, but it may create noise. Decide how to deploy it.',
      choices: [
        { id: 'c1', label: 'Hotfix now', effect: { security: 2, power: 0, stealth: -1 } },
        { id: 'c2', label: 'Staged rollout', effect: { security: 1, power: 1, stealth: 1 } },
        { id: 'c3', label: 'Shadow deploy', effect: { security: 0, power: 0, stealth: 2 } },
      ],
    },
    {
      id: 'M3',
      title: 'Tessa’s Route',
      narrative: 'Tessa proposes a stealth route to bait the attackers. It’s slower, but safer.',
      choices: [
        { id: 'c1', label: 'Bait + capture', effect: { security: 1, power: 0, stealth: 2 } },
        { id: 'c2', label: 'Hard block', effect: { security: 2, power: 0, stealth: 0 } },
        { id: 'c3', label: 'Counter-scan', effect: { security: 1, power: 2, stealth: -1 } },
      ],
    },
  ];
}

export function TokenStrategyDashboard(props: { featuredImage?: string; loreStory?: string; gameDescription?: string; gameName?: string; game: any }) {
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult, isActive: krexBoostActive, until: krexBoostUntil, txHash: krexBoostTx } = useKrexBoosters('token-strategy');
  const missions = useMemo(() => buildMissions(), []);
  const [tab, setTab] = useState<TabId>('play');
  const [missionIndex, setMissionIndex] = useState(0);
  const [stats, setStats] = useState({ security: 0, power: 0, stealth: 0 });

  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  const tierMult = tier === 'Tier4' ? 1.25 : tier === 'Tier3' ? 1.15 : tier === 'Tier2' ? 1.1 : 1;
  const booster = tierMult * (hasAnyNFT ? 1.05 : 1) * krexBoosterMult;
  const score = Math.floor((stats.security * 120 + stats.power * 90 + stats.stealth * 110) * booster);

  const mission = missions[missionIndex]!;

  const categories = (props.game?.categories ?? []) as string[];
  const tags = (props.game?.tags ?? []) as string[];

  const playHealth: GameActivityHealth =
    missionIndex > 0 || stats.security + stats.power + stats.stealth > 0
      ? missionIndex >= missions.length - 1 && stats.security + stats.power + stats.stealth > 0
        ? 'exhausted'
        : 'active'
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
            title={
              playHealth === 'active'
                ? 'Mission in progress'
                : playHealth === 'exhausted'
                  ? 'Mission chain complete'
                  : 'Idle'
            }
          />
        ),
      },
      { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
      { id: 'milestones', label: 'Milestones', icon: <IconMilestones /> },
      { id: 'boosters', label: 'Boosters', icon: <IconBoosters /> },
      { id: 'comments', label: 'Comments', icon: <IconComments /> },
    ],
    [playHealth],
  );

  const deckResources: GameDeckResource[] = useMemo(
    () => [
      {
        id: 'score',
        label: 'Score',
        value: (
          <span className="inline-flex items-center gap-2">
            {score.toLocaleString()}
            <GameActivityStatusDot
              health={playHealth}
              title={
                playHealth === 'active'
                  ? 'Mission in progress'
                  : playHealth === 'exhausted'
                    ? 'Mission chain complete'
                    : 'Idle'
              }
            />
          </span>
        ),
        description: 'In-game currency',
        subValue: `Mission ${missionIndex + 1}/${missions.length}`,
        accent: 'games',
        onClick: () => setTab('play'),
      },
    ],
    [score, playHealth, missionIndex, missions.length],
  );
  const milestoneProgress = useMemo(
    () => ({
      strategy_rounds: missionIndex + (stats.security + stats.power + stats.stealth > 0 ? 1 : 0),
      generic_progress: score,
    }),
    [missionIndex, stats.security, stats.power, stats.stealth, score],
  );
  const { level: playerLevel } = useGameMilestones('token-strategy', milestoneProgress);

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
          deckFooter="Values update live as you complete missions."
          playerLevel={playerLevel}
        />
      }
      main={
        <>
        {tab === 'overview' && (
          <div className="space-y-6">
            <GamePanelCard title="Briefing" hint="Decide what moves first.">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Null Gang doesn’t kick the door in - it taps the edges until something blinks. Your job is to decide what moves first:{' '}
                <strong>Security</strong>, <strong>Power</strong>, or <strong>Stealth</strong>.
              </p>
            </GamePanelCard>

            <GamePanelCard title="How to play" hint="Quick rules.">
              <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <li>Pay entry once, then pick actions across missions.</li>
                <li>Your stats stack and convert into a final score.</li>
                <li>Boosters are optional (KREX tier + NFT deck + optional KREX booster).</li>
              </ul>
            </GamePanelCard>

            <GamePanelCard title="References" hint="Worldbuilding links.">
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Open{' '}
                <Link href="/chronicles/characters" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                  Characters
                </Link>{' '}
                and{' '}
                <Link href="/chronicles/chapters" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-300">
                  Chapters
                </Link>{' '}
                for dossiers and story context.
              </p>
            </GamePanelCard>

            <GameOverviewSections
              gameName={props.gameName ?? 'Token Strategy'}
              kicker="Game guide"
              subtitle="Defend Kasparex networks with Security, Power, and Stealth choices."
              description={props.gameDescription}
              loreStory={props.loreStory}
              tips={[
                {
                  title: 'Mission tip',
                  body: 'Balance Security, Power, and Stealth across rounds. Null Gang pressure punishes lopsided builds more than steady ones.',
                },
              ]}
              flow={[
                'Pay the KAS mission entry to open the defense chain.',
                'Each round, pick responses that reshape Security, Power, and Stealth.',
                'Optional KREX boosters and NFT deck bonuses multiply final outcomes.',
                'Claim rewards later via Rewards & Points when Hub pools allow.',
              ]}
            />
          </div>
        )}

        {tab === 'boosters' && (
          <div className="space-y-6">
            <KrexBoosterCard gameId="token-strategy" title="KREX booster" />
          </div>
        )}

        {tab === 'rewards' && (
          <RewardsPreview showLink={true} />
        )}

        {tab === 'milestones' && (
          <MilestonesPanel gameId="token-strategy" progress={milestoneProgress} />
        )}

        {tab === 'comments' && (
          <CommentsSection articleId={gameCommentsArticleId('token-strategy')} dappSectionHeader />
        )}

        {tab === 'play' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                  Mission {missionIndex + 1}/{missions.length}
                </p>
                <h3 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">{mission.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{mission.narrative}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Score</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{score}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              {mission.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800/60"
                  onClick={() => {
                    setStats((s) => ({
                      security: s.security + c.effect.security,
                      power: s.power + c.effect.power,
                      stealth: s.stealth + c.effect.stealth,
                    }));
                    if (missionIndex < missions.length - 1) setMissionIndex((i) => i + 1);
                  }}
                >
                  {c.label}
                  <span className="ml-3 text-xs font-semibold text-zinc-500 dark:text-zinc-500">
                    +sec {c.effect.security} · +pow {c.effect.power} · +sth {c.effect.stealth}
                  </span>
                </button>
              ))}
            </div>

            <GamesAdaptiveGrid gapClass="gap-3" className="mt-5">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Security</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.security}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Power</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.power}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500">Stealth</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{stats.stealth}</p>
              </div>
            </GamesAdaptiveGrid>
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

        <GamePanelCard title="Entry" hint="Pay once to start the mission chain.">
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Pay once to start the mission chain.</p>
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

