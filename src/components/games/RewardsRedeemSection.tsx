'use client';

import type { ReactNode } from 'react';

export type MinecoreRedeemExtras = {
  /** Budget window + pending totals for transparency (game redeem flows). */
  redeemBudgetDayKey?: string;
  refinementPointsSpentOnGrid?: number;
  refinementPointsSpentOnKrex?: number;
  gridRedeemablePending?: number;
  krexRedeemablePending?: number;
};

/**
 * Rewards / Redeem tab shell. Diamond Refinement UI lives on the Game Deck;
 * this section only hosts ledger / history children (and optional trailing CTAs).
 */
export function RewardsRedeemSection({
  diamondRefinementHeaderTrailing,
  children,
}: {
  /** @deprecated Unused; kept for call-site compatibility. */
  diamondsBalance?: number;
  /** @deprecated Kept for call-site compatibility; Hub totals live on /rewards. */
  refinementPointsBalance?: number;
  /** @deprecated Kept for call-site compatibility. */
  unifiedRedeemablePoints?: number;
  /** @deprecated Kept for call-site compatibility. */
  hubLedgerNetPoints?: number;
  /** @deprecated Kept for call-site compatibility. */
  balanceSplitFootnote?: boolean;
  /** @deprecated Refine from the Game Deck instead. */
  onRefine?: (amount: number) => void;
  /** @deprecated In-game GRID/KREX swap removed; spend on /rewards. */
  onRedeem?: (points: number, token?: 'GRID' | 'KREX') => void;
  /** @deprecated Kept for call-site compatibility; exchange UI removed. */
  minecoreExtras?: MinecoreRedeemExtras;
  /** Optional CTA shown above ledger (e.g. Start all mines). */
  diamondRefinementHeaderTrailing?: ReactNode;
  /** @deprecated Kept for call-site compatibility. */
  diamondRefinementFooter?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Refine history</h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Refine Diamonds into Hub points from the Game Deck above. Spend on the{' '}
            <a href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
              Rewards
            </a>{' '}
            page.
          </p>
        </div>
        {diamondRefinementHeaderTrailing ? (
          <div className="flex w-full justify-end sm:w-auto">{diamondRefinementHeaderTrailing}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
