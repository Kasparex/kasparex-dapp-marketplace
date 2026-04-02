'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import { getChroniclesLocalSeasonSnapshot } from '@/lib/chronicles/leaderboard/localState';
import { scoreChroniclesSeason } from '@/lib/leaderboard/scoring';
import { REDEEM_CATALOG, type RedeemItem } from '@/lib/redeem/catalog';
import { recordRedeem, sumRedeemedPoints } from '@/lib/redeem/storage';

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

export function RedeemPanel() {
  const { state } = useKaspaWallet();
  const addr = state.address ? normAddr(state.address) : '';
  const season = useMemo(() => currentSeasonWindowUtc(), []);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const availablePoints = useMemo(() => {
    if (!addr) return 0;
    const snap = getChroniclesLocalSeasonSnapshot(addr, season.id);
    const score = scoreChroniclesSeason(snap);
    const redeemed = sumRedeemedPoints(addr, season.id);
    return Math.max(0, (score.totalPoints ?? 0) - redeemed);
  }, [addr, season.id]);

  const itemsWithState = useMemo(() => {
    return REDEEM_CATALOG.map((it) => ({
      ...it,
      canRedeem: addr.length > 0 && availablePoints >= it.costPoints,
    }));
  }, [addr.length, availablePoints]);

  function redeem(it: RedeemItem) {
    if (!addr) {
      setNote('Connect your Kaspa wallet to redeem.');
      return;
    }
    if (availablePoints < it.costPoints) {
      setNote('Not enough points to redeem this item.');
      return;
    }
    setNote(null);
    setBusyId(it.id);
    try {
      recordRedeem({
        wallet: addr,
        seasonId: season.id,
        itemId: it.id,
        costPoints: it.costPoints,
      });
      setNote(`Redeemed: ${it.title}. (MVP: recorded locally)`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div id="redeem" className="scroll-mt-24 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#02abb8]">Redeem</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Redeem points for perks. MVP uses your <span className="font-semibold">local season points</span> (browser wallet activity) until backend fulfillment is wired.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3 text-right">
          <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Available</p>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{availablePoints.toLocaleString()}</p>
        </div>
      </div>

      {!addr ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Connect your Kaspa wallet to enable redemption.</p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">Wallet: {addr}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {itemsWithState.map((it) => (
          <div key={it.id} className="rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-zinc-900 dark:text-zinc-100 truncate">{it.title}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{it.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Cost</p>
                <p className="text-base font-black text-zinc-900 dark:text-zinc-100">{it.costPoints.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Season: <span className="font-mono">{season.id}</span></span>
              <button
                type="button"
                className="k-control-btn"
                disabled={!it.canRedeem || busyId === it.id}
                onClick={() => redeem(it)}
              >
                {busyId === it.id ? 'Redeeming…' : it.canRedeem ? 'Redeem' : 'Not enough points'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {note ? <p className="text-sm text-amber-700 dark:text-amber-400">{note}</p> : null}
    </div>
  );
}

