'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { listGames } from '@/lib/games/registry';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useWalletDeck } from '@/hooks/useWalletDeck';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { StatusDot } from '@/components/ui/StatusDot';
import { TooltipProvider } from '@/components/ui/Tooltip';

function ConnectionsContent() {
  const { state: walletState } = useKaspaWallet();
  const { data, isLoading } = useWalletDeck();
  const { tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();

  const games = useMemo(() => listGames(), []);

  const rows = useMemo(() => {
    const r: Array<{
      from: string;
      to: { label: string; href: string };
      requirement?: string;
      actionKey?: string;
      actionHint?: string;
      punch: string;
      entry: string;
      rewards: string;
    }> = [];

    for (const g of games) {
      const entry = g.entryCostKAS ? `${g.entryCostKAS} KAS` : 'Free';
      const rewards =
        g.rewardConfig?.gridReward || g.rewardConfig?.xpReward
          ? `${g.rewardConfig?.gridReward ? `${g.rewardConfig.gridReward} GRID` : ''}${g.rewardConfig?.gridReward && g.rewardConfig?.xpReward ? ' · ' : ''}${g.rewardConfig?.xpReward ? `${g.rewardConfig.xpReward} XP` : ''}`
          : 'Unified deck';

      for (const c of g.connections ?? []) {
        const href = c.toHref ?? (c.toSlug ? `/games/${c.toSlug}` : '/games');
        const label = c.toSlug ? games.find((x) => x.slug === c.toSlug)?.name ?? c.toSlug : c.title;
        r.push({
          from: g.name,
          to: { label, href },
          requirement: c.requirement,
          actionKey: c.actionKey,
          actionHint: c.actionHint,
          punch: c.punch,
          entry,
          rewards,
        });
      }
    }
    return r;
  }, [games]);

  const diamonds = data?.diamonds?.balance ?? 0;
  const hasAnyNFT =
    Boolean(nftStatus?.hasKREXPRIME) ||
    Boolean(nftStatus?.hasPIXELKREX) ||
    Boolean(nftStatus?.hasDiamondKREXPRIME) ||
    Boolean(nftStatus?.hasDiamondPIXELKREX) ||
    Boolean(nftStatus?.hasRarestNFT) ||
    Boolean(nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections).some(Boolean));

  function actionDotForRow(row: { actionKey?: string; actionHint?: string; requirement?: string }) {
    if (!walletState.isConnected) {
      return { tone: 'bad' as const, tip: 'Connect your wallet to track requirements.' };
    }
    const key = row.actionKey ?? 'none';
    if (key === 'diamonds_100') {
      if (isLoading) return { tone: 'info' as const, tip: 'Checking your diamonds…' };
      return diamonds >= 100
        ? { tone: 'ok' as const, tip: 'Ready: you have enough diamonds to refine.' }
        : { tone: 'warn' as const, tip: row.actionHint ?? 'Mine more diamonds, then refine.' };
    }
    if (key === 'krex_or_nft') {
      const ready = (tier && tier !== 'Tier0') || hasAnyNFT;
      return ready
        ? { tone: 'ok' as const, tip: 'Ready: you have tier/deck boosts available.' }
        : { tone: 'warn' as const, tip: row.actionHint ?? 'Hold KREX or equip an NFT for boosts.' };
    }
    if (key === 'read_chronicles') {
      return { tone: 'info' as const, tip: row.actionHint ?? 'Open Chapters / Characters for context.' };
    }
    if (key === 'wallet') {
      return { tone: 'ok' as const, tip: 'Wallet connected.' };
    }
    return { tone: 'info' as const, tip: row.actionHint ?? row.requirement ?? 'No required action.' };
  }

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

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Kasparex Games connections</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              A lightweight map of cross-game requirements and “what to do next”. If a connection says you need something, it’s telling you where to farm it.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40">
                  <tr>
                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">From</th>
                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">To</th>
                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Status</th>
                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Requirement</th>
                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Why / next step</th>
                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Play info</th>
                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Rewards</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                        No connections defined yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      (() => {
                        const dot = actionDotForRow(row);
                        return (
                      <tr key={`${row.from}-${row.to.href}-${idx}`} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">{row.from}</td>
                        <td className="p-4">
                          <Link href={row.to.href} className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
                            {row.to.label}
                          </Link>
                        </td>
                        <td className="p-4">
                          <StatusDot tone={dot.tone} tooltip={dot.tip} />
                        </td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-400">{row.requirement ?? '—'}</td>
                        <td className="p-4 text-zinc-700 dark:text-zinc-300">{row.punch}</td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-400">{row.entry}</td>
                        <td className="p-4 text-zinc-600 dark:text-zinc-400">{row.rewards}</td>
                      </tr>
                        );
                      })()
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function GameConnectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-base">
          Loading…
        </div>
      }
    >
      <TooltipProvider>
        <ConnectionsContent />
      </TooltipProvider>
    </Suspense>
  );
}

