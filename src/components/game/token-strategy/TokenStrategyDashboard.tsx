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

export function TokenStrategyDashboard(props: { featuredImage?: string; gameDescription?: string; gameName?: string; game: any }) {
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult } = useKrexBoosters('token-strategy');

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

  return (
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

        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h3 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">How it works</h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Choose mission actions to build Security, Power, and Stealth. Your final score is a lightweight summary, boosted by your KREX tier, NFT deck, and optional KREX booster.
            </p>
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

        {tab === 'comments' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Community comments</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Share builds and mission choices. Wallet required to post.</p>
            </div>
            <CommentsSection articleId="game:token-strategy" />
          </div>
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

            <div className="mt-5 grid grid-cols-3 gap-3">
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
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-4">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50">
          {props.featuredImage ? (
            <div className="relative aspect-video w-full bg-zinc-200 dark:bg-zinc-800">
              <img src={props.featuredImage} alt={props.gameName ?? 'Token Strategy'} className="h-full w-full object-cover" />
            </div>
          ) : null}
          <div className="p-5">
            <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">{props.gameName ?? 'Token Strategy'}</h2>
            {props.gameDescription ? (
              <p className="mb-4 border-l-2 border-emerald-500/40 bg-emerald-500/5 py-2 pl-3 pr-2 text-sm leading-relaxed text-zinc-600 dark:bg-emerald-500/10 dark:text-zinc-400">
                {props.gameDescription}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Entry</h3>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Pay once to start the mission chain.</p>
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
  );
}

