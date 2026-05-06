'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { HubHaloHeader } from '@/components/hub/HubHaloHeader';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';
import { useRedeemablePointsBreakdown } from '@/hooks/useRedeemablePointsBreakdown';
import { RewardsL2Gate } from '@/components/rewards/RewardsL2Gate';

export function RewardsHeader(props: { onSessionVerifiedChange?: () => void }) {
  const breakdown = useRedeemablePointsBreakdown();
  const hasAddr = breakdown.address.length > 0;

  return (
    <HubHaloHeader
      id="rewards-intro"
      badgeVariant="pulse"
      badgeLabel="Rewards hub"
      title="Rewards"
      subtitle={
        <p className="m-0">
          Earn redeemable points across Kasparex Hub, then spend them here on perks, badges, coupons, and token pools. Some offers use your Kaspa wallet only;
          others ask you to verify an EVM wallet when an on-chain route is involved.
        </p>
      }
      actions={
        <>
          <a
            href="#rewards-catalog"
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
          >
            Browse offers
          </a>
          <Link href="/leaderboard" className="k-control-btn">
            Leaderboard
          </Link>
        </>
      }
      rightSlot={
        <div className="w-full max-w-[280px] mx-auto lg:mx-0 lg:ml-auto">
          <div className="rounded-2xl border border-cyan-500/25 bg-white/85 dark:bg-zinc-950/55 px-4 py-4 space-y-3 shadow-lg shadow-cyan-500/5">
            {!hasAddr ? (
              <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-400 m-0">
                Connect your Kaspa wallet from the header to see redeemable points tied to your hub profile.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 m-0">Total redeemable</p>
                  <Tooltip
                    content={gameTooltipRich(
                      'Redeemable balance',
                      'One hub-wide number for your Kaspa address: gameplay-linked points plus anything tracked in your Rewards wallet. Live cross-device totals will arrive as backend sync rolls out.',
                    )}
                  >
                    <button
                      type="button"
                      className="rounded-md p-0.5 text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                      aria-label="About redeemable balance"
                    >
                      <Info className="h-4 w-4" aria-hidden />
                    </button>
                  </Tooltip>
                </div>
                <p className="text-4xl font-black tabular-nums text-zinc-900 dark:text-white">{breakdown.totalRedeemable.toLocaleString()} points</p>
                <p className="text-[11px] text-zinc-500 mt-1">Balance reflects this device for now; synced totals will follow.</p>
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
            <div className={`border-t border-cyan-500/15 pt-3 ${hasAddr ? 'mt-1' : ''}`}>
              <RewardsL2Gate embedded onSessionVerifiedChange={props.onSessionVerifiedChange} />
            </div>
          </div>
        </div>
      }
    />
  );
}
