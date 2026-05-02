'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { payKaspaL1 } from '@/lib/games/sdk';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  MINECORE_DAILY_GRID_POINTS_CAP,
  MINECORE_DAILY_KREX_POINTS_CAP,
  MINECORE_DISPLAY_POOL_GRID_REMAINING,
  MINECORE_DISPLAY_POOL_KREX_REMAINING,
  MINECORE_GRID_PER_REFINEMENT_POINT,
  MINECORE_KREX_PER_REFINEMENT_POINT,
  MINECORE_REFINE_POINTS_PER_DIAMOND,
} from '@/lib/game/minecore/config';
import { minecoreUtcDayKey } from '@/lib/game/minecore/plant-economy';
import * as Icons from 'lucide-react';

const PANEL = 'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6';
const LABEL = 'text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5 block';
const INPUT =
  'h-11 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 text-sm font-semibold outline-none focus:border-sky-500 dark:text-white transition-colors';

export type MinecoreRedeemExtras = {
  /** From `MinecoreState.redeemBudget` + pending totals for transparency. */
  redeemBudgetDayKey?: string;
  refinementPointsSpentOnGrid?: number;
  refinementPointsSpentOnKrex?: number;
  gridRedeemablePending?: number;
  krexRedeemablePending?: number;
};

export function RewardsRedeemSection({
  diamondsBalance,
  refinementPointsBalance,
  onRefine,
  onRedeem,
  minecoreExtras,
  diamondRefinementHeaderTrailing,
  diamondRefinementFooter,
  children,
}: {
  diamondsBalance: number;
  refinementPointsBalance: number;
  onRefine?: (amount: number) => void;
  onRedeem?: (points: number, token?: 'GRID' | 'KREX') => void;
  /** When set (e.g. Minecore tab), shows pool + daily caps from shared config. */
  minecoreExtras?: MinecoreRedeemExtras;
  /** Right side of the Diamond Refinement header row (e.g. prominent bulk mining CTA). */
  diamondRefinementHeaderTrailing?: ReactNode;
  /** Below the refine grid inside the Diamond Refinement panel. */
  diamondRefinementFooter?: ReactNode;
  children?: ReactNode;
}) {
  const [refineAmount, setRefineAmount] = useState<number | ''>('');
  const [redeemPoints, setRedeemPoints] = useState<number | ''>('');
  const [targetToken, setTargetToken] = useState<'GRID' | 'KREX'>('GRID');
  const [l2Address, setL2Address] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const { state: kaspaWalletState } = useKaspaWallet();

  const todayKey = useMemo(() => minecoreUtcDayKey(Date.now()), []);

  const dailyRemaining = useMemo(() => {
    if (!minecoreExtras) return null;
    const dk = minecoreExtras.redeemBudgetDayKey ?? todayKey;
    const gridSpent = dk === todayKey ? (minecoreExtras.refinementPointsSpentOnGrid ?? 0) : 0;
    const krexSpent = dk === todayKey ? (minecoreExtras.refinementPointsSpentOnKrex ?? 0) : 0;
    return {
      grid: Math.max(0, MINECORE_DAILY_GRID_POINTS_CAP - gridSpent),
      krex: Math.max(0, MINECORE_DAILY_KREX_POINTS_CAP - krexSpent),
    };
  }, [minecoreExtras, todayKey]);

  const handleVerify = async () => {
    if (!l2Address.startsWith('kaspa:') && !l2Address.startsWith('0x')) {
      alert('Please enter a valid L2 address (0x... or kaspa:...)');
      return;
    }
    setIsVerifying(true);
    try {
      if (!kaspaWalletState.isConnected || !kaspaWalletState.address || !kaspaWalletState.provider) {
        alert('Please connect your Kaspa wallet first.');
        return;
      }
      const result = await payKaspaL1({
        provider: kaspaWalletState.provider,
        fromKaspaAddress: kaspaWalletState.address,
        toKaspaAddress: 'kaspa:qre2h08c3wqyyd8d227z54nvzex4028wz3nvf4xy226jry9d5uqpqxdfwxfn2',
        amountKas: 0.1,
      });
      if (result.ok) setIsVerified(true);
      else alert('Verification failed.');
    } catch {
      alert('Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const refineOutput =
    typeof refineAmount === 'number' ? refineAmount * MINECORE_REFINE_POINTS_PER_DIAMOND : 0;
  const redeemOutput =
    typeof redeemPoints === 'number'
      ? targetToken === 'GRID'
        ? redeemPoints * MINECORE_GRID_PER_REFINEMENT_POINT
        : redeemPoints * MINECORE_KREX_PER_REFINEMENT_POINT
      : 0;

  const walletConnected = kaspaWalletState.isConnected && Boolean(kaspaWalletState.address);

  return (
    <div className="space-y-4">
      {/* ── Diamond Refinement ── */}
      <div className={PANEL}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Diamond Refinement</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {MINECORE_REFINE_POINTS_PER_DIAMOND} refinement point per diamond (before Worker / Refining module bonuses in
              Minecore).
            </p>
          </div>
          <div className="flex w-full flex-shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:items-end sm:text-right">
            <div>
              <div className="text-[10px] font-semibold text-amber-500">Available</div>
              <div className="text-xl font-bold tabular-nums text-amber-500">{diamondsBalance.toLocaleString()} D</div>
              {minecoreExtras ? (
                <p className="mt-0.5 max-w-xs text-right text-[10px] text-zinc-500 dark:text-zinc-400 sm:ml-auto">
                  Total matches the game deck (wallet + in-mine). Mining credits here automatically; no extra extract step.
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
                +{refineOutput.toLocaleString()} Points
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
                Connect your Kaspa L1 wallet to refine (profile-bound).
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

      {/* ── Token Redemption ── */}
      <div className={PANEL}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Redeem Points</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Uses refinement points from the step above. Distribution follows published caps and pools.</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Balance</div>
            <div className="text-xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{refinementPointsBalance.toLocaleString()} P</div>
          </div>
        </div>

        {minecoreExtras ? (
          <div className="mb-4 grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">Minecore economics (visible rates)</div>
            <div className="grid gap-1 font-mono tabular-nums text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
              <span>1 Point → {MINECORE_GRID_PER_REFINEMENT_POINT} GRID</span>
              <span>1 Point → {MINECORE_KREX_PER_REFINEMENT_POINT} KREX</span>
              <span>Pool (display) GRID: {MINECORE_DISPLAY_POOL_GRID_REMAINING.toLocaleString()}</span>
              <span>Pool (display) KREX: {MINECORE_DISPLAY_POOL_KREX_REMAINING.toLocaleString()}</span>
              {dailyRemaining ? (
                <>
                  <span>Daily cap GRID: {MINECORE_DAILY_GRID_POINTS_CAP.toLocaleString()} P · left {dailyRemaining.grid.toLocaleString()} P</span>
                  <span>Daily cap KREX: {MINECORE_DAILY_KREX_POINTS_CAP.toLocaleString()} P · left {dailyRemaining.krex.toLocaleString()} P</span>
                </>
              ) : null}
              {(minecoreExtras.gridRedeemablePending != null || minecoreExtras.krexRedeemablePending != null) && (
                <>
                  <span>Pending GRID claim: {(minecoreExtras.gridRedeemablePending ?? 0).toLocaleString()}</span>
                  <span>Pending KREX claim: {(minecoreExtras.krexRedeemablePending ?? 0).toLocaleString()}</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
              Daily caps are enforced client-side in V1; on-chain distribution can replace this later.
            </p>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className={`rounded-lg border p-4 transition-colors ${isVerified ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={LABEL} style={{ marginBottom: 0 }}>
                1. Link L2 Wallet
              </span>
              {isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  <Icons.CheckCircle2 className="w-3 h-3" /> Linked
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="kaspa:... or 0x..."
                value={l2Address}
                onChange={(e) => setL2Address(e.target.value)}
                disabled={isVerified}
                className={INPUT + ' flex-1 disabled:opacity-50'}
              />
              {!isVerified && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying || !l2Address}
                  className="px-4 h-11 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold uppercase transition-colors disabled:opacity-40"
                >
                  {isVerifying ? 'Wait…' : 'Verify'}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 items-end">
            <div>
              <label className={LABEL}>2. Select Token</label>
              <div className="grid grid-cols-2 gap-2">
                {(['GRID', 'KREX'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTargetToken(t)}
                    className={`h-11 rounded-lg text-xs font-bold uppercase transition-all border ${
                      targetToken === t
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={LABEL}>3. Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={redeemPoints}
                  onChange={(e) =>
                    setRedeemPoints(
                      e.target.value === ''
                        ? ''
                        : Math.max(0, Math.min(refinementPointsBalance, parseInt(e.target.value, 10))),
                    )
                  }
                  placeholder="0"
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={() => setRedeemPoints(refinementPointsBalance)}
                  className="absolute right-2 top-2 h-7 rounded px-2 text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  All
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                if (onRedeem && typeof redeemPoints === 'number') onRedeem(redeemPoints, targetToken);
                setRedeemPoints('');
              }}
              disabled={Boolean(
                !walletConnected ||
                  !isVerified ||
                  !redeemPoints ||
                  redeemPoints <= 0 ||
                  (dailyRemaining &&
                    targetToken === 'GRID' &&
                    redeemPoints > dailyRemaining.grid) ||
                  (dailyRemaining && targetToken === 'KREX' && redeemPoints > dailyRemaining.krex),
              )}
              className="k-cta-games h-11 w-full text-sm disabled:opacity-40"
            >
              {redeemPoints ? `Receive ${redeemOutput.toLocaleString()} ${targetToken}` : 'Redeem Points'}
            </button>
            <p className="mt-2 text-center text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Rate: 1 Point = {targetToken === 'GRID' ? `${MINECORE_GRID_PER_REFINEMENT_POINT} GRID` : `${MINECORE_KREX_PER_REFINEMENT_POINT} KREX`}
            </p>
            {!walletConnected ? (
              <p className="mt-1 text-center text-[11px] text-amber-600 dark:text-amber-400">
                Connect L1 wallet to redeem (same profile as mining).
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
