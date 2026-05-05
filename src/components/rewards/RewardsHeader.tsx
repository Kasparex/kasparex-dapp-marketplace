'use client';

import Link from 'next/link';
import { HubHaloHeader } from '@/components/hub/HubHaloHeader';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';

export function RewardsHeader() {
  const breakdown = useRedeemablePointsBreakdown();
  const hasAddr = breakdown.address.length > 0;

  return (
    <HubHaloHeader
      id="rewards-intro"
      badgeVariant="pulse"
      badgeLabel="Rewards hub"
      title={
        <>
          Unified{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 via-cyan-600 to-teal-600 dark:from-cyan-300 dark:via-cyan-300 dark:to-teal-300">
            redeemable points
          </span>
        </>
      }
      subtitle={
        <p className="m-0">
          Spend Hub-wide points mined from Minecore refinement, Chronicles reads and NFT placements, plus future integrations. Larger token pool redemptions
          stay behind the L2 gate until contract routes finalize.
        </p>
      }
      actions={
        <>
          <a
            href="#rewards-catalog"
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
          >
            Browse catalog
          </a>
          <Link href="/leaderboard" className="k-control-btn">
            Leaderboard
          </Link>
        </>
      }
      rightSlot={
        <>
          <div className="rounded-2xl border border-cyan-500/25 bg-white/85 dark:bg-zinc-950/55 px-5 py-5 space-y-2 shadow-lg shadow-cyan-500/5">
            {!hasAddr ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Connect your Kaspa wallet from the header to show Minecore refinement and Hub ledger balances tied to your address.
              </p>
            ) : (
              <>
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Total redeemable</p>
                <p className="text-4xl font-black tabular-nums text-zinc-900 dark:text-white">{breakdown.totalRedeemable.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Totals are local previews until indexer-backed balances ship.</p>
                <div className="space-y-1.5 pt-2">
                  {breakdown.lines.map((line) => (
                    <div key={line.id} className="flex justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <span>{line.label}</span>
                      <span className="font-mono font-semibold tabular-nums">{line.points.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      }
    />
  );
}
