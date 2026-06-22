'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantMilestone } from '@/hooks/useCovenantMilestone';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';

function shortAddr(a: string) {
  const x = a.replace(/^kaspa:/i, '');
  return x.length > 14 ? `${x.slice(0, 8)}...${x.slice(-4)}` : x;
}

function defaultUnlock(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16);
}

export function CovenantMilestoneWidget() {
  const { state } = useKaspaWallet();
  const { deals, loading, error, createDeal, claimStep, refresh } = useCovenantMilestone();
  const [tab, setTab] = useState<'create' | 'deals'>('create');
  const [beneficiary, setBeneficiary] = useState('');
  const [totalKas, setTotalKas] = useState('1');
  const [memo, setMemo] = useState('');
  const [m1, setM1] = useState({ label: 'Deposit', pct: '40', unlock: defaultUnlock(7) });
  const [m2, setM2] = useState({ label: 'Delivery', pct: '40', unlock: defaultUnlock(14) });
  const [m3, setM3] = useState({ label: 'Final', pct: '20', unlock: defaultUnlock(21) });
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  if (!state.isConnected) {
    return (
      <p className="px-6 py-8 text-center text-zinc-500">
        Connect wallet to create or claim milestone escrows.
      </p>
    );
  }

  const handleCreate = async () => {
    setBusy(true);
    try {
      const rows = [m1, m2, m3];
      const milestones = rows.map((r) => ({
        label: r.label,
        shareBps: Math.round(parseFloat(r.pct) * 100),
        unlockAt: new Date(r.unlock).getTime(),
      }));
      await createDeal({
        beneficiary: beneficiary.trim(),
        totalKas: parseFloat(totalKas),
        memo,
        milestones,
      });
      setTab('deals');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-6 py-4 max-w-2xl mx-auto space-y-4">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Covenant Milestone</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Staged L1 payouts: funds unlock per milestone on schedule (Silverscript 1:1 transitions).
        </p>
      </header>
      <div className="flex gap-2">
        {(['create', 'deals'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg ${tab === t ? 'bg-[#02abb8] text-white' : 'text-zinc-500'}`}
          >
            {t === 'create' ? 'New deal' : `Deals (${deals.length})`}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {tab === 'create' && (
        <div className="space-y-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
          <input
            className="w-full px-3 py-2 rounded-lg border text-sm dark:bg-zinc-900"
            placeholder="Beneficiary kaspa:..."
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
          <input
            type="number"
            min={minKas}
            className="w-full px-3 py-2 rounded-lg border text-sm dark:bg-zinc-900"
            value={totalKas}
            onChange={(e) => setTotalKas(e.target.value)}
          />
          {[m1, m2, m3].map((m, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 text-sm">
              <input
                className="px-2 py-1 border rounded dark:bg-zinc-900"
                value={i === 0 ? m1.label : i === 1 ? m2.label : m3.label}
                onChange={(e) =>
                  (i === 0 ? setM1 : i === 1 ? setM2 : setM3)({ ...m, label: e.target.value })
                }
              />
              <input
                type="number"
                className="px-2 py-1 border rounded dark:bg-zinc-900"
                value={i === 0 ? m1.pct : i === 1 ? m2.pct : m3.pct}
                onChange={(e) =>
                  (i === 0 ? setM1 : i === 1 ? setM2 : setM3)({ ...m, pct: e.target.value })
                }
              />
              <input
                type="datetime-local"
                className="px-2 py-1 border rounded dark:bg-zinc-900 text-xs"
                value={i === 0 ? m1.unlock : i === 1 ? m2.unlock : m3.unlock}
                onChange={(e) =>
                  (i === 0 ? setM1 : i === 1 ? setM2 : setM3)({ ...m, unlock: e.target.value })
                }
              />
            </div>
          ))}
          <input
            className="w-full px-3 py-2 rounded-lg border text-sm dark:bg-zinc-900"
            placeholder="Memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreate()}
            className="w-full py-2 bg-[#02abb8] text-white rounded-lg disabled:opacity-50"
          >
            Fund milestone deal
          </button>
        </div>
      )}
      {tab === 'deals' && (
        <div className="space-y-3">
          <button type="button" className="text-xs text-[#02abb8]" onClick={() => void refresh()}>
            Refresh
          </button>
          {loading && !deals.length ? (
            <p className="text-zinc-500 text-center py-6">Loading...</p>
          ) : (
            deals.map((d) => (
              <div key={d.id} className="border rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{d.status}</span>
                  <span className="font-semibold">{sompiToKasNumber(d.totalSompi)} KAS</span>
                </div>
                <p className="text-zinc-500">
                  {shortAddr(d.depositor)} → {shortAddr(d.beneficiary)}
                </p>
                {d.milestones.map((s) => {
                  const canClaim =
                    state.address &&
                    normalizeAddr(state.address) === normalizeAddr(d.beneficiary) &&
                    !s.claimed &&
                    Date.now() >= s.unlockAt;
                  return (
                    <div key={s.id} className="flex justify-between items-center border-t pt-2">
                      <span>
                        {s.label}: {sompiToKasNumber(s.amountSompi)} KAS
                        {s.claimed ? ' (claimed)' : ''}
                      </span>
                      {canClaim && (
                        <button
                          type="button"
                          className="text-xs text-[#02abb8] border px-2 py-1 rounded"
                          onClick={() => void claimStep(d.id, s.id)}
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
