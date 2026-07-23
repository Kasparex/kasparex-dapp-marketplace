'use client';

import { useState, type ReactNode } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { MINECORE_REFINE_POINTS_PER_DIAMOND } from '@/lib/game/minecore/config';

const PANEL = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6';
const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 block';
const INPUT =
  'h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm font-semibold outline-none focus:border-sky-500 dark:text-white transition-colors';

export type MinecoreRedeemExtras = {
  /** Budget window + pending totals for transparency (game redeem flows). */
  redeemBudgetDayKey?: string;
  refinementPointsSpentOnGrid?: number;
  refinementPointsSpentOnKrex?: number;
  gridRedeemablePending?: number;
  krexRedeemablePending?: number;
};

export function RewardsRedeemSection({
  diamondsBalance,
  refinementPointsBalance,
  unifiedRedeemablePoints,
  hubLedgerNetPoints,
  balanceSplitFootnote,
  onRefine,
  diamondRefinementHeaderTrailing,
  diamondRefinementFooter,
  children,
}: {
  diamondsBalance: number;
  /** Points earned in this game (shown in Hub Rewards). */
  refinementPointsBalance: number;
  /** When set, Balance shows full hub total. */
  unifiedRedeemablePoints?: number;
  /** Optional Rewards-wallet credits shown beside game balance. */
  hubLedgerNetPoints?: number;
  /** With `unifiedRedeemablePoints`, shows hub vs game split. */
  balanceSplitFootnote?: boolean;
  onRefine?: (amount: number) => void;
  /** @deprecated In-game GRID/KREX swap removed; spend on /rewards. */
  onRedeem?: (points: number, token?: 'GRID' | 'KREX') => void;
  /** @deprecated Kept for call-site compatibility; exchange UI removed. */
  minecoreExtras?: MinecoreRedeemExtras;
  /** Right side of the Diamond Refinement header row (e.g. prominent bulk mining CTA). */
  diamondRefinementHeaderTrailing?: ReactNode;
  /** Below the refine grid inside the Diamond Refinement panel. */
  diamondRefinementFooter?: ReactNode;
  children?: ReactNode;
}) {
  const [refineAmount, setRefineAmount] = useState<number | ''>('');
  const { state: kaspaWalletState } = useKaspaWallet();

  const refineOutput =
    typeof refineAmount === 'number' ? refineAmount * MINECORE_REFINE_POINTS_PER_DIAMOND : 0;

  const walletConnected = kaspaWalletState.isConnected && Boolean(kaspaWalletState.address);
  const pointsShown = unifiedRedeemablePoints ?? refinementPointsBalance;

  return (
    <div className="space-y-4">
      <div className={PANEL}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Diamond Refinement</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Each diamond adds {MINECORE_REFINE_POINTS_PER_DIAMOND} redeem point before crew bonuses apply. Spend redeem
              points on the{' '}
              <a href="/rewards" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
                Rewards
              </a>{' '}
              page.
            </p>
          </div>
          <div className="flex w-full flex-shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:items-end sm:text-right">
            <div>
              <div className="text-[10px] font-semibold text-amber-500">Available</div>
              <div className="text-xl font-bold tabular-nums text-amber-500">{diamondsBalance.toLocaleString()} D</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                Redeem points
              </div>
              <div className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">
                {pointsShown.toLocaleString()}
              </div>
              {unifiedRedeemablePoints != null && balanceSplitFootnote ? (
                <p className="mt-1 max-w-[240px] text-right text-[10px] leading-snug text-zinc-500 dark:text-zinc-400 sm:ml-auto">
                  Hub total · game balance{' '}
                  <span className="font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                    {refinementPointsBalance.toLocaleString()}
                  </span>
                  {hubLedgerNetPoints != null && hubLedgerNetPoints !== 0 ? (
                    <>
                      {' '}
                      · Rewards wallet{' '}
                      <span className="font-semibold tabular-nums">{hubLedgerNetPoints.toLocaleString()}</span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
            {diamondRefinementHeaderTrailing ? (
              <div className="flex w-full justify-end">{diamondRefinementHeaderTrailing}</div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 items-end">
          <div>
            <label className={LABEL}>Amount to Refine</label>
            <div className="relative">
              <input
                type="number"
                value={refineAmount}
                onChange={(e) =>
                  setRefineAmount(
                    e.target.value === '' ? '' : Math.max(0, Math.min(diamondsBalance, parseInt(e.target.value, 10))),
                  )
                }
                placeholder="0"
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => setRefineAmount(diamondsBalance)}
                className="absolute right-2 top-2 h-7 rounded px-2 text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Max
              </button>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">You receive</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                +{refineOutput.toLocaleString()} points
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onRefine && typeof refineAmount === 'number') onRefine(refineAmount);
                setRefineAmount('');
              }}
              disabled={!walletConnected || !refineAmount || refineAmount <= 0}
              className="k-cta-games h-11 w-full text-sm disabled:opacity-40"
            >
              Refine Now
            </button>
            {!walletConnected ? (
              <p className="mt-2 text-center text-[11px] text-amber-600 dark:text-amber-400">
                Connect your Kaspa wallet to refine — same profile you use across the hub.
              </p>
            ) : null}
          </div>
        </div>

        {diamondRefinementFooter ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            {diamondRefinementFooter}
          </div>
        ) : null}
      </div>

      {children}
    </div>
  );
}
