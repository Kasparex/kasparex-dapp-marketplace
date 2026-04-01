'use client';

import { useEffect, useMemo, useState } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { computeRewardBreakdown, rewardsPoolPercent, rewardsSplits, rewardsWalletAddress } from '@/lib/leaderboard/rewardsPool';

type BalanceResponse = { success?: boolean; balance?: string | null };

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
}

export function ProjectedRewardsCards() {
  const [balanceKas, setBalanceKas] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wallet = rewardsWalletAddress();
  const poolPercent = rewardsPoolPercent();
  const split = rewardsSplits();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Prefer internal API, then fallback directly to Kaspa API if needed.
        let kas = 0;
        const res = await fetch(`/api/kaspa/balance?address=${encodeURIComponent(wallet)}`, { cache: 'no-store' });
        const j = (await res.json()) as BalanceResponse;
        if (j.success && j.balance) {
          const sompis = Number(j.balance);
          kas = Number.isFinite(sompis) ? sompis / 100000000 : 0;
        } else {
          const addressNoPrefix = wallet.replace(/^kaspa:/i, '');
          const fallback = await fetch('https://api.kaspa.org/v1/addresses/utxos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ addresses: [addressNoPrefix] }),
            cache: 'no-store',
          });
          if (!fallback.ok) throw new Error('Could not load rewards wallet balance.');
          const data = (await fallback.json()) as { entries?: Array<{ amount?: number | string }>; utxos?: Array<{ amount?: number | string }> };
          const source = Array.isArray(data.entries) ? data.entries : Array.isArray(data.utxos) ? data.utxos : [];
          const sumSompis = source.reduce((acc, x) => {
            const v = typeof x.amount === 'string' ? Number(x.amount) : Number(x.amount ?? 0);
            return Number.isFinite(v) && v > 0 ? acc + v : acc;
          }, 0);
          kas = sumSompis / 100000000;
        }
        if (!cancelled) setBalanceKas(kas);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load rewards wallet balance.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const breakdown = useMemo(() => computeRewardBreakdown(balanceKas), [balanceKas]);
  const helpText = `Pool is ${poolPercent}% of rewards wallet balance. Split is ${split[0]}/${split[1]}/${split[2]}. Final values are frozen at season close.`;

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-4 chronicles-vault-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Projected rewards</p>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Estimated from rewards wallet balance. These values are live until the season snapshot is finalized.
          </p>
        </div>
        <Tooltip content={helpText} side="left" align="start">
          <button type="button" className="k-control-btn h-9 px-3 text-xs">
            How calculated
          </button>
        </Tooltip>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">1st place</p>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{loading ? '...' : `${fmt(breakdown.firstKas)} KAS`}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">2nd place</p>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{loading ? '...' : `${fmt(breakdown.secondKas)} KAS`}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">3rd place</p>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{loading ? '...' : `${fmt(breakdown.thirdKas)} KAS`}</p>
        </div>
      </div>

      <div className="text-sm text-zinc-600 dark:text-zinc-300 space-y-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/20 px-3 py-2">
        <p>Rewards wallet: <span className="font-mono break-all">{wallet}</span></p>
        <p><span className="font-semibold">Balance:</span> {loading ? 'Loading…' : `${fmt(breakdown.balanceKas)} KAS`} · <span className="font-semibold">Pool ({poolPercent}%):</span> {loading ? '…' : `${fmt(breakdown.poolKas)} KAS`}</p>
        {error ? <p className="text-red-600 dark:text-red-400">Could not load rewards wallet balance from APIs.</p> : null}
      </div>
    </div>
  );
}
