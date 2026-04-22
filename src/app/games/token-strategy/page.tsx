'use client';

import { Suspense, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GameModulesBar } from '@/components/games/modules/GameModulesBar';
import { GamePayment } from '@/components/games/GamePayment';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getGameBySlugFromRegistry } from '@/lib/games/registry';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useKrexBoosters } from '@/hooks/useKrexBoosters';
import { KrexBoosterCard } from '@/components/games/boosters/KrexBoosterCard';

const KaspaL1WalletButton = dynamic(
  () => import('@/components/KaspaL1WalletButton').then((mod) => ({ default: mod.KaspaL1WalletButton })),
  { ssr: false }
);

type Choice = { id: string; label: string; effect: { security: number; power: number; stealth: number } };
type Mission = { id: string; title: string; narrative: string; choices: Choice[] };

function buildMissions(): Mission[] {
  return [
    {
      id: 'M1',
      title: 'Signal Spike',
      narrative:
        'Kasparex detects a spike. Null Gang might be probing the perimeter. Pick your first response.',
      choices: [
        { id: 'c1', label: 'Lock down endpoints', effect: { security: 2, power: 0, stealth: 1 } },
        { id: 'c2', label: 'Trace the payload', effect: { security: 1, power: 1, stealth: 1 } },
        { id: 'c3', label: 'Overclock scanners', effect: { security: 0, power: 2, stealth: 0 } },
      ],
    },
    {
      id: 'M2',
      title: 'Vector’s Patch',
      narrative:
        'Vector offers a quick patch, but it may create noise. Decide how to deploy it.',
      choices: [
        { id: 'c1', label: 'Hotfix now', effect: { security: 2, power: 0, stealth: -1 } },
        { id: 'c2', label: 'Staged rollout', effect: { security: 1, power: 1, stealth: 1 } },
        { id: 'c3', label: 'Shadow deploy', effect: { security: 0, power: 0, stealth: 2 } },
      ],
    },
    {
      id: 'M3',
      title: 'Tessa’s Route',
      narrative:
        'Tessa proposes a stealth route to bait the attackers. It’s slower, but safer.',
      choices: [
        { id: 'c1', label: 'Bait + capture', effect: { security: 1, power: 0, stealth: 2 } },
        { id: 'c2', label: 'Hard block', effect: { security: 2, power: 0, stealth: 0 } },
        { id: 'c3', label: 'Counter-scan', effect: { security: 1, power: 2, stealth: -1 } },
      ],
    },
  ];
}

function TokenStrategyGame() {
  const { state: walletState } = useKaspaWallet();
  const game = getGameBySlugFromRegistry('token-strategy');
  const missions = useMemo(() => buildMissions(), []);
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult } = useKrexBoosters('token-strategy');

  const [missionIndex, setMissionIndex] = useState(0);
  const [stats, setStats] = useState({ security: 0, power: 0, stealth: 0 });

  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  const booster =
    (tier === 'legendary' ? 1.25 : tier === 'premium' ? 1.15 : tier === 'gold' ? 1.1 : 1) *
    (hasAnyNFT ? 1.05 : 1) *
    krexBoosterMult;
  const mission = missions[missionIndex]!;

  if (!game) return <div className="p-8 text-zinc-600 dark:text-zinc-400">Game not found</div>;

  if (!walletState.isConnected) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
          <svg className="w-16 h-16 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-zinc-100">{game.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto text-base">{game.description}</p>
        <div className="[&_button]:h-14 [&_button]:px-8 [&_button]:text-base">
          <KaspaL1WalletButton />
        </div>
      </div>
    );
  }

  const score = Math.floor((stats.security * 120 + stats.power * 90 + stats.stealth * 110) * booster);

  return (
    <div className="space-y-6">
      <GameModulesBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Mission {missionIndex + 1}/{missions.length}
              </div>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{mission.title}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">{mission.narrative}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Score</div>
              <div className="text-xl font-black text-zinc-900 dark:text-zinc-100">{score}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">×{booster.toFixed(2)} boosters</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {mission.choices.map((c) => (
              <button
                key={c.id}
                type="button"
                className="text-left px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => {
                  setStats((s) => ({
                    security: s.security + c.effect.security,
                    power: s.power + c.effect.power,
                    stealth: s.stealth + c.effect.stealth,
                  }));
                  if (missionIndex < missions.length - 1) setMissionIndex((i) => i + 1);
                }}
              >
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.label}</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  +sec {c.effect.security} • +pow {c.effect.power} • +sth {c.effect.stealth}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Security</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{stats.security}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Power</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{stats.power}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Stealth</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{stats.stealth}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Entry</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Pay once to start a mission chain.</div>
            <GamePayment game={game} />
          </div>
          <KrexBoosterCard gameId="token-strategy" title="KREX booster" />
        </div>
      </div>
    </div>
  );
}

function PageInner() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),transparent_70%)] blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(139,92,246,0.1),transparent_70%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.04]" />
      </div>

      <Header />

      <main className="flex-1 relative z-10 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="mb-6">
            <Link
              href="/games"
              className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors group text-base font-medium"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Games
            </Link>
          </div>

          <div className="flex-1">
            <TokenStrategyGame />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TokenStrategyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-base">
          Loading…
        </div>
      }
    >
      <PageInner />
    </Suspense>
  );
}

