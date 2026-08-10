'use client';

import type { CrowdfundTier } from '@/lib/covenant/crowdfund-types';
import { sortTiersByMinKas } from '@/lib/donations/tiers';
import { quoteVDonateL1Pledge } from '@/lib/donations/l1PledgePayment';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import { crowdkasPrimaryBtnClass } from '@/components/donations/CrowdKasUi';
import { useKREXBalance } from '@/hooks/useKREXBalance';

export function VDonateRewardTierList({
  tiers,
  selectedTierId,
  onSelectAndPledge,
  busy,
  compact,
  isLive = true,
  unlockedTierIds,
}: {
  tiers: CrowdfundTier[];
  selectedTierId?: string | null;
  /** Fires with tier id so parent can set amount + run covenant pledge payment. */
  onSelectAndPledge: (tier: CrowdfundTier) => void;
  busy?: boolean;
  /** Rail: denser cards. Tab: larger Kickstarter-style cards. */
  compact?: boolean;
  isLive?: boolean;
  /** Tiers whose reward content is unlocked for the connected backer. */
  unlockedTierIds?: Set<string> | ReadonlySet<string>;
}) {
  const { tier: krexTier } = useKREXBalance();
  const sorted = sortTiersByMinKas(tiers);
  if (sorted.length === 0) {
    return (
      <p className="kx-body">
        No reward tiers on this campaign. You can still enter a custom pledge amount.
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {sorted.map((tier) => {
        const soldOut =
          tier.limitedQty != null &&
          tier.limitedQty > 0 &&
          (tier.claimedCount ?? 0) >= tier.limitedQty;
        const active = selectedTierId === tier.id;
        const remaining =
          tier.limitedQty != null
            ? Math.max(0, tier.limitedQty - (tier.claimedCount ?? 0))
            : null;
        const quote = quoteVDonateL1Pledge(tier.minKas, krexTier);
        const unlocked = unlockedTierIds?.has(tier.id) ?? false;
        const rewardLines = [tier.reward, tier.description].filter(
          (s): s is string => Boolean(s?.trim()),
        );

        return (
          <article
            key={tier.id}
            className={`${KX_SURFACE_NESTED} overflow-hidden transition-colors ${
              active ? 'ring-2 ring-emerald-500/50 border-emerald-500/40' : ''
            } ${soldOut && !unlocked ? 'opacity-60' : ''}`}
          >
            <div className={compact ? 'p-4 space-y-3' : 'p-5 sm:p-6 space-y-4'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={`font-black tracking-tight text-zinc-900 dark:text-zinc-100 ${
                      compact ? 'text-base' : 'text-xl'
                    }`}
                  >
                    {tier.title}
                  </p>
                  <p className="mt-1 text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">
                    Pledge {tier.minKas} KAS or more
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {unlocked ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-200">
                      Unlocked
                    </span>
                  ) : null}
                  {remaining != null ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200">
                      {soldOut ? 'Sold out' : `${remaining} left`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-zinc-200/80 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      Unlimited
                    </span>
                  )}
                </div>
              </div>

              {rewardLines.length > 0 ? (
                unlocked ? (
                  <ul className="space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                    {rewardLines.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] px-3 py-3 space-y-1">
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Reward content locked
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Pledge this tier (or more) to unlock the full reward details.
                    </p>
                  </div>
                )
              ) : unlocked ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No extra reward copy on this tier. Your pledge still counts toward the goal.
                </p>
              ) : null}

              {isLive && !soldOut && !unlocked ? (
                <div className="pt-1 space-y-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onSelectAndPledge(tier)}
                    className={crowdkasPrimaryBtnClass}
                  >
                    {busy && active ? 'Pledging…' : `Pledge ${tier.minKas} KAS`}
                  </button>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Total ~{quote.totalKas} KAS including platform fee
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
