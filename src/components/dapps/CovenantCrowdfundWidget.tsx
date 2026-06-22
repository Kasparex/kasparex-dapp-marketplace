'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';

function shortAddr(a: string) {
  const x = a.replace(/^kaspa:/i, '');
  return x.length > 14 ? `${x.slice(0, 8)}...${x.slice(-4)}` : x;
}

export function CovenantCrowdfundWidget() {
  const { state } = useKaspaWallet();
  const { allCampaigns, loading, error, createCampaign, pledge, claimFunds, refund, refresh } =
    useCovenantCrowdfund();
  const [tab, setTab] = useState<'browse' | 'create'>('browse');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [goalKas, setGoalKas] = useState('5');
  const [deadline, setDeadline] = useState('');
  const [pledgeAmounts, setPledgeAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  if (!state.isConnected) {
    return (
      <p className="px-6 py-8 text-center text-zinc-500">
        Connect wallet to browse or launch assurance crowdfunds.
      </p>
    );
  }

  const handleCreate = async () => {
    if (!deadline) return;
    setBusy(true);
    try {
      await createCampaign({
        title,
        memo,
        goalKas: parseFloat(goalKas),
        deadline: new Date(deadline),
      });
      setTab('browse');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-6 py-4 max-w-2xl mx-auto space-y-4">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Covenant Crowdfund</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Goal-based pooling: creator claims if funded by deadline, else backers refund (assurance contract).
        </p>
      </header>
      <div className="flex gap-2">
        {(['browse', 'create'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-lg ${tab === t ? 'bg-[#02abb8] text-white' : 'text-zinc-500'}`}
          >
            {t === 'browse' ? 'Campaigns' : 'Launch'}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {tab === 'create' && (
        <div className="space-y-3 border rounded-xl p-4">
          <input
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
            placeholder="Campaign title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            type="number"
            min={minKas}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
            placeholder="Goal KAS"
            value={goalKas}
            onChange={(e) => setGoalKas(e.target.value)}
          />
          <input
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-900"
            placeholder="Memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !title}
            onClick={() => void handleCreate()}
            className="w-full py-2 bg-[#02abb8] text-white rounded-lg disabled:opacity-50"
          >
            Create campaign
          </button>
        </div>
      )}
      {tab === 'browse' && (
        <div className="space-y-3">
          <button type="button" className="text-xs text-[#02abb8]" onClick={() => void refresh()}>
            Refresh
          </button>
          {loading && !allCampaigns.length ? (
            <p className="text-center text-zinc-500 py-6">Loading...</p>
          ) : (
            allCampaigns.map((c) => {
              const raised = sompiToKasNumber(c.raisedSompi);
              const goal = sompiToKasNumber(c.goalSompi);
              const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
              const isCreator =
                state.address && normalizeAddr(state.address) === normalizeAddr(c.creator);
              return (
                <div key={c.id} className="border rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>{c.title}</span>
                    <span className="text-xs uppercase">{c.status}</span>
                  </div>
                  <p className="text-zinc-500">{c.memo}</p>
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#02abb8]" style={{ width: `${pct}%` }} />
                  </div>
                  <p>
                    {raised.toFixed(4)} / {goal} KAS ({pct.toFixed(0)}%)
                  </p>
                  <p className="text-xs text-zinc-500">
                    Creator {shortAddr(c.creator)} · ends {new Date(c.deadline).toLocaleString()}
                  </p>
                  {c.status === 'funding' && (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={minKas}
                        step="0.01"
                        className="flex-1 px-2 py-1 border rounded text-sm dark:bg-zinc-900"
                        placeholder="Pledge KAS"
                        value={pledgeAmounts[c.id] ?? ''}
                        onChange={(e) =>
                          setPledgeAmounts((p) => ({ ...p, [c.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="px-3 py-1 bg-[#02abb8] text-white rounded text-xs"
                        onClick={() =>
                          void pledge(c.id, parseFloat(pledgeAmounts[c.id] || '0')).then(() =>
                            setPledgeAmounts((p) => ({ ...p, [c.id]: '' }))
                          )
                        }
                      >
                        Pledge
                      </button>
                    </div>
                  )}
                  {isCreator && c.status === 'succeeded' && !c.claimedAt && (
                    <button
                      type="button"
                      className="w-full py-1.5 border border-[#02abb8] text-[#02abb8] rounded text-xs"
                      onClick={() => void claimFunds(c.id)}
                    >
                      Claim raised funds
                    </button>
                  )}
                  {c.status === 'failed' &&
                    c.pledges
                      .filter(
                        (p) =>
                          !p.refunded &&
                          state.address &&
                          normalizeAddr(p.backer) === normalizeAddr(state.address)
                      )
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full py-1.5 border rounded text-xs mt-1"
                          onClick={() => void refund(c.id, p.id)}
                        >
                          Refund {sompiToKasNumber(p.amountSompi)} KAS
                        </button>
                      ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
