'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { currentSeasonWindowUtc } from '@/lib/leaderboard/seasons';
import {
  exportChroniclesLeaderboardLocal,
  getChroniclesLocalSeasonSnapshot,
  importChroniclesLeaderboardLocal,
} from '@/lib/chronicles/leaderboard/localState';
import { scoreChroniclesSeason } from '@/lib/leaderboard/scoring';
import { RewardTooltip } from '@/components/rewards/RewardTooltip';
import { sumLeaderboardUnitsForSeason } from '@/lib/rewards/hub-ledger';

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

function msToTimeLeft(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function SeasonProgressCard({ title = 'Your season progress' }: { title?: string }) {
  const { state } = useKaspaWallet();
  const addr = state.address ? normAddr(state.address) : '';
  const [now, setNow] = useState(() => Date.now());
  const [ledgerTick, setLedgerTick] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const bump = () => setLedgerTick((n) => n + 1);
    window.addEventListener('kasparex-hub-ledger', bump);
    return () => window.removeEventListener('kasparex-hub-ledger', bump);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const season = useMemo(() => currentSeasonWindowUtc(now), [now]);

  const score = useMemo(() => {
    if (!addr) return null;
    const snap = getChroniclesLocalSeasonSnapshot(addr, season.id);
    return scoreChroniclesSeason(snap);
  }, [addr, season.id]);

  const hubSeasonScore = useMemo(() => {
    if (!addr) return 0;
    return sumLeaderboardUnitsForSeason(addr.toLowerCase(), season.id);
  }, [addr, season.id, ledgerTick]);

  const timeLeft = season.endUtcMs - now;
  const duration = Math.max(1, season.endUtcMs - season.startUtcMs);
  const elapsed = Math.min(duration, Math.max(0, now - season.startUtcMs));
  const pct = (elapsed / duration) * 100;

  function exportJson() {
    setError(null);
    setNote(null);
    try {
      const raw = exportChroniclesLeaderboardLocal();
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kxc-chronicles-leaderboard-local_${season.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNote('Exported local season data.');
    } catch {
      setError('Export failed.');
    }
  }

  async function importJsonFile(file: File) {
    setError(null);
    setNote(null);
    try {
      const raw = await file.text();
      const res = importChroniclesLeaderboardLocal(raw);
      if (!res.ok) throw new Error(res.error);
      setNote('Imported local season data.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 sm:p-7 space-y-4 chronicles-vault-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">{title}</p>
            <RewardTooltip
              showTrailingIcon={false}
              description="Shows the unified hub ledger rollup for this UTC season alongside your Chronicles module snapshot (reads, NFT slots). Hub scores sync when you verify reads or NFT slot changes inside Chronicles. Legacy export/import still restores the Chronicles preview only."
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-400 text-[10px] font-black text-zinc-500">
                i
              </span>
            </RewardTooltip>
          </div>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Season <span className="font-mono">{season.id}</span> ends in {msToTimeLeft(timeLeft)}.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-[#02abb8]"
            style={{ width: `${pct.toFixed(2)}%` }}
            aria-label="Season progress"
          />
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{new Date(season.startUtcMs).toLocaleDateString()}</span>
          <span>{new Date(season.endUtcMs).toLocaleDateString()}</span>
        </div>
      </div>

      {!addr ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Connect your Kaspa wallet to see your local season progress.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Hub season score</p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{hubSeasonScore}</p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
              Chronicles module points: <span className="font-semibold">{score?.totalPoints ?? 0}</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Reads</p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{score?.confirmedReadsCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/30 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Filled slots</p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{score?.filledSlotsCount ?? 0}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={exportJson} className="k-control-btn">
          Export
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="k-control-btn">
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJsonFile(f);
          }}
        />
        {addr ? <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">{addr}</span> : null}
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {note ? <p className="text-sm text-amber-700 dark:text-amber-400">{note}</p> : null}
    </div>
  );
}

