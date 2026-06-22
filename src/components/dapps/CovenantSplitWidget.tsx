'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantSplit } from '@/hooks/useCovenantSplit';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import type { SplitPayment, SplitRecipient } from '@/lib/covenant';

type TabId = 'create' | 'splits' | 'about';

interface RecipientRow {
  key: string;
  address: string;
  percent: string;
}

function sompiToKas(sompi: string): string {
  return (Number(BigInt(sompi)) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function shortAddr(addr: string): string {
  const a = addr.replace(/^kaspa:/i, '');
  if (a.length <= 12) return a;
  return `${a.slice(0, 8)}...${a.slice(-6)}`;
}

function norm(addr: string): string {
  return addr.trim().toLowerCase().replace(/^kaspa:/i, '');
}

function canClaimShare(
  split: SplitPayment,
  recipient: SplitRecipient,
  address: string | null
): boolean {
  if (split.status !== 'open' || recipient.claimed || !address) return false;
  return norm(recipient.address) === norm(address);
}

function newRow(): RecipientRow {
  return { key: `row_${Math.random().toString(36).slice(2, 9)}`, address: '', percent: '' };
}

export function CovenantSplitWidget() {
  const { state: kaspaState } = useKaspaWallet();
  const { splits, isLoading, error, createSplit, claimShare, refreshSplits } = useCovenantSplit();

  const [tab, setTab] = useState<TabId>('create');
  const [rows, setRows] = useState<RecipientRow[]>([
    { key: 'a', address: '', percent: '50' },
    { key: 'b', address: '', percent: '50' },
  ]);
  const [totalKas, setTotalKas] = useState('1');
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);

  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const percentSum = useMemo(
    () => rows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0),
    [rows]
  );

  const preview = useMemo(() => {
    const total = parseFloat(totalKas) || 0;
    return rows.map((r) => ({
      ...r,
      kas: total > 0 ? ((parseFloat(r.percent) || 0) / 100) * total : 0,
    }));
  }, [rows, totalKas]);

  const openCount = useMemo(() => splits.filter((s) => s.status === 'open').length, [splits]);

  const updateRow = (key: string, patch: Partial<RecipientRow>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    if (rows.length >= 8) return;
    setRows((prev) => [...prev, newRow()]);
  };

  const removeRow = (key: string) => {
    if (rows.length <= 2) return;
    setRows((prev) => prev.filter((r) => r.key !== key));
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      const recipients = rows.map((r) => ({
        address: r.address.trim(),
        shareBps: Math.round((parseFloat(r.percent) || 0) * 100),
      }));
      await createSplit({
        totalKas: parseFloat(totalKas),
        memo: memo.trim(),
        recipients,
      });
      setMemo('');
      setTab('splits');
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async (splitId: string, recipientId: string) => {
    setBusy(true);
    try {
      await claimShare(splitId, recipientId);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (!kaspaState.isConnected) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Connect your Kaspa wallet to create or claim covenant split payments.
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Covenant Split
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          1:N programmable payment: one lock, many recipients with enforced share rules (Silverscript fan-out).
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          Prototype: per-recipient claims update covenant state locally until Toccata wallet support ships.
        </p>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        {(
          [
            ['create', 'Create split'],
            ['splits', `Splits (${splits.length})`],
            ['about', 'How it works'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              tab === id
                ? 'bg-[#02abb8] text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {tab === 'create' && (
        <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Total amount (KAS, min {minKas})
            </label>
            <input
              type="number"
              min={minKas}
              step="0.01"
              value={totalKas}
              onChange={(e) => setTotalKas(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recipients</span>
              <span
                className={`text-xs ${Math.abs(percentSum - 100) < 0.01 ? 'text-green-600' : 'text-amber-600'}`}
              >
                Total: {percentSum.toFixed(1)}% (must be 100%)
              </span>
            </div>
            {preview.map((row) => (
              <div key={row.key} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    placeholder="kaspa:..."
                    value={row.address}
                    onChange={(e) => updateRow(row.key, { address: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  />
                  <p className="text-xs text-zinc-500 pl-1">
                    ~{row.kas.toFixed(4)} KAS
                  </p>
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.1}
                    value={row.percent}
                    onChange={(e) => updateRow(row.key, { percent: e.target.value })}
                    className="w-full px-2 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-center"
                  />
                  <p className="text-[10px] text-center text-zinc-500 mt-0.5">%</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 2}
                  className="mt-2 p-2 text-zinc-400 hover:text-red-500 disabled:opacity-30"
                  aria-label="Remove recipient"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addRow}
              disabled={rows.length >= 8}
              className="text-sm text-[#02abb8] hover:underline disabled:opacity-40"
            >
              + Add recipient
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Memo (optional)
            </label>
            <input
              type="text"
              maxLength={COVENANT_LAB_CONFIG.maxMemoLength}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Team payout, revenue share..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          <button
            type="button"
            disabled={
              busy ||
              isLoading ||
              rows.some((r) => !r.address.trim()) ||
              Math.abs(percentSum - 100) > 0.01
            }
            onClick={() => void handleCreate()}
            className="w-full py-2.5 rounded-lg bg-[#02abb8] text-white font-medium hover:bg-[#028a94] disabled:opacity-50"
          >
            {busy ? 'Creating...' : 'Create split payment'}
          </button>
        </div>
      )}

      {tab === 'splits' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm text-zinc-600 dark:text-zinc-400">
            <span>{openCount} open, {splits.length} total</span>
            <button type="button" onClick={() => void refreshSplits()} className="text-[#02abb8] text-xs hover:underline">
              Refresh
            </button>
          </div>
          {isLoading && splits.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">Loading...</p>
          ) : splits.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No splits yet.</p>
          ) : (
            splits.map((split) => (
              <div
                key={split.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900/40 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        split.status === 'open'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-green-500/20 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {split.status}
                    </span>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      From {shortAddr(split.depositor)}
                    </p>
                  </div>
                  <span className="font-semibold">{sompiToKas(split.totalSompi)} KAS</span>
                </div>
                {split.memo && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{split.memo}</p>
                )}
                <ul className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                  {split.recipients.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <span className="font-mono text-xs">{shortAddr(r.address)}</span>
                        <span className="text-zinc-500 ml-2">
                          {(r.shareBps / 100).toFixed(1)}% ({sompiToKas(r.amountSompi)} KAS)
                        </span>
                        {r.claimed && (
                          <span className="ml-2 text-xs text-green-600">claimed</span>
                        )}
                      </div>
                      {canClaimShare(split, r, kaspaState.address) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleClaim(split.id, r.id)}
                          className="text-xs px-2 py-1 rounded border border-[#02abb8] text-[#02abb8] hover:bg-[#02abb8]/10"
                        >
                          Claim share
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] font-mono text-zinc-500 truncate" title={split.covenantId}>
                  Covenant: {split.covenantId}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-3">
          <p>
            <strong>Covenant Split</strong> models a 1:N fan-out: one payer locks KAS and covenant
            rules require outputs to match fixed percentage shares. Each recipient claims their slice
            independently (N parallel continuation paths in a full Silverscript deployment).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Shares must total exactly 100% (enforced in simulator and future script).</li>
            <li>Amounts are allocated in sompi; the last recipient gets any rounding remainder.</li>
            <li>Maps to Silverscript <code>#[covenant.fanout]</code> / 1:N verification patterns.</li>
            <li>Use cases: team payouts, creator splits, treasury revenue share, game prize pools.</li>
          </ul>
          <p className="text-xs text-zinc-500">
            Reference: <code>covenant-lockbox/split-payment.sil</code>
          </p>
        </div>
      )}
    </div>
  );
}
