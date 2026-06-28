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
      hideAccentFrames
      badgeVariant="pulse"
      badgeLabel="Rewards hub"
      title="Rewards"
      subtitle={
        <p className="m-0">
          Earn and spend redeemable points on hub perks and pools. Some routes may ask you to verify a second wallet.
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
          <a
            href="#rewards-points"
            className="k-control-btn"
          >
            Points policy
          </a>
        </>
      }
      rightSlot={
        <div className="w-full min-w-0 mx-auto lg:mx-0 lg:ml-auto max-w-xl">
          <div className="rounded-xl border border-cyan-500/25 bg-white/85 dark:bg-zinc-950/55 shadow-lg shadow-cyan-500/5 overflow-hidden min-w-0 flex flex-col">
            <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-3 min-w-0">
              {!hasAddr ? (
                <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-400 m-0">
                  Connect your wallet to see redeemable points.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 gap-y-1 min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500 m-0">Total redeemable</p>
                    <Tooltip
                      content={gameTooltipRich(
                        'Redeemable balance',
                        'Estimated points you can spend here. Totals can update as you use the hub.',
                      )}
                    >
                      <button
                        type="button"
                        className="rounded-md p-0.5 text-zinc-400 hover:bg-zinc-200/80 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors shrink-0"
                        aria-label="About redeemable balance"
                      >
                        <Info className="h-4 w-4" aria-hidden />
                      </button>
                    </Tooltip>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black tabular-nums text-zinc-900 dark:text-white leading-tight break-words">
                    {breakdown.totalRedeemable.toLocaleString()} pts
                  </p>
                </>
              )}
            </div>
            <div className="border-t border-cyan-500/15 bg-zinc-50/70 dark:bg-zinc-950/40 px-5 py-4 sm:px-6 sm:pb-5 min-w-0 shrink-0">
              <RewardsL2Gate embedded onSessionVerifiedChange={props.onSessionVerifiedChange} />
            </div>
          </div>
        </div>
      }
    />
  );
}
