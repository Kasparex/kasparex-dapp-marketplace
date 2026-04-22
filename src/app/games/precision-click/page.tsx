'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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

type Target = { id: string; x: number; y: number; r: number; ttlMs: number; createdAt: number };

function PrecisionClickGame() {
  const { state: walletState } = useKaspaWallet();
  const game = getGameBySlugFromRegistry('precision-click');
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { multiplier: krexBoosterMult } = useKrexBoosters('precision-click');

  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  const tierMult =
    tier === 'Tier4' ? 1.25 : tier === 'Tier3' ? 1.15 : tier === 'Tier2' ? 1.1 : 1;
  const booster = tierMult * (hasAnyNFT ? 1.05 : 1) * krexBoosterMult;

  const arenaRef = useRef<HTMLDivElement | null>(null);
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
      'ARIA’s fragment pulses — you must lock it precisely.',
      'Vector’s calibration drifts. Click with intent.',
      'Tessa marks a stealth window. No wasted motion.',
    ],
    []
  );
  const [lore, setLore] = useState(loreLines[0]!);

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

  return (
    <div className="space-y-6">
      <GameModulesBar />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Precision training
              </div>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Lock the fragments</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">{lore}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Boosters</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">×{booster.toFixed(2)}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">KREX tier + NFT deck</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Time</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{(timeLeftMs / 1000).toFixed(1)}s</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Hits</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{hits}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Score</div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">{Math.floor(score * booster)}</div>
            </div>
          </div>

          <div
            ref={arenaRef}
            className="relative w-full h-[360px] rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {!running ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-[#02abb8] hover:bg-[#028a94] text-white font-semibold transition-colors"
                  onClick={() => setRunning(true)}
                >
                  Start 30s run
                </button>
              </div>
            ) : null}

            {targets.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-label="Target"
                className="absolute rounded-full bg-emerald-500/30 border border-emerald-500/40 hover:bg-emerald-500/40 transition-colors"
                style={{
                  left: t.x - t.r,
                  top: t.y - t.r,
                  width: t.r * 2,
                  height: t.r * 2,
                }}
                onClick={() => {
                  setTargets((all) => all.filter((x) => x.id !== t.id));
                  setHits((h) => h + 1);
                  setScore((s) => s + Math.max(10, Math.floor(60 - t.r)));
                }}
              />
            ))}
          </div>

          <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Misses (expired targets): <span className="font-semibold text-zinc-900 dark:text-zinc-100">{misses}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Entry</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Pay once to begin training runs.</div>
            <GamePayment game={game} />
          </div>
          <KrexBoosterCard gameId="precision-click" title="KREX booster" />
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
            <PrecisionClickGame />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PrecisionClickPage() {
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

