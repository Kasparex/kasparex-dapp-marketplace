'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantSplit } from '@/hooks/useCovenantSplit';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import type { SplitPayment, SplitRecipient } from '@/lib/covenant';
import {
  CovenantFieldLabel,
  CovenantError,
  CovenantTabPanel,
  CovenantCreateShell,
  covenantInputClass,
  covenantSmallInputClass,
  covenantCardClass,
  covenantSecondaryBtnClass,
  shortKaspaAddr,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { KpxCovenantDisconnected, KpxCovenantShell } from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantMetadataView } from '@/components/dapps/covenant/KpxCovenantMetadataView';
import { useCovenantWidgetRail } from '@/hooks/useCovenantWidgetRail';
import { useKpxCovenantDeployFee } from '@/hooks/useKpxCovenantDeployFee';
import { covenantPremiumAddButtonLabel } from '@/lib/covenant/kpxCovenantPricing';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import { splitMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'create' | 'splits' | 'metadata';

interface RecipientRow {
  key: string;
  address: string;
  percent: string;
}

function sompiToKas(sompi: string): string {
  return (Number(BigInt(sompi)) / 1e8).toLocaleString(undefined, { maximumFractionDigits: 8 });
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
  const { splits, isLoading, error, createSplit, claimShare, refreshSplits, runtimeMode, effectiveMode } =
    useCovenantSplit();
  const tab = useDAppWidgetSection('create') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  useRegisterWidgetTabLabel('splits', `Splits (${splits.length})`, [splits.length]);
  const [rows, setRows] = useState<RecipientRow[]>([
    { key: 'a', address: '', percent: '50' },
    { key: 'b', address: '', percent: '50' },
  ]);
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('split', rows.length);
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
  const metadataInstances = useMemo(() => splitMetadataInstances(splits), [splits]);

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
      navigateTab('splits');
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

  const splitTotal = parseFloat(totalKas) || 0;
  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? splitTotal : undefined,
    enabled: tab === 'create',
    primaryAction: (
      <button
        type="button"
        disabled={
          busy ||
          isLoading ||
          rows.some((r) => !r.address.trim()) ||
          Math.abs(percentSum - 100) > 0.01
        }
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? 'Creating...'
          : pricing.waived
            ? 'Create split payment'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & create split`}
      </button>
    ),
    deps: [tab, busy, isLoading, rows, percentSum, pricing, totalKas, rows.length, memo],
  });

  if (!kaspaState.isConnected) {
    return <KpxCovenantDisconnected template="split" />;
  }

  return (
    <KpxCovenantShell template="split" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>


      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <CovenantCreateShell template="split" heading="Create split">
          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label={`Total amount (KAS, min ${minKas})`}
              htmlFor="split-total"
              tooltip="The full amount you lock. It is divided among recipients by the percentages below."
            />
            <input
              id="split-total"
              type="number"
              min={minKas}
              step="0.01"
              value={totalKas}
              onChange={(e) => setTotalKas(e.target.value)}
              className={covenantInputClass}
            />
          </div>

          <div className="k-form-group !mb-0 space-y-4">
            <div className="flex justify-between items-center">
              <CovenantFieldLabel
                label="Recipients"
                tooltip="Add Kaspa addresses and a share for each. All percentages must add up to exactly 100%."
              />
              <span
                className={`text-xs font-medium ${
                  Math.abs(percentSum - 100) < 0.01
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                Total: {percentSum.toFixed(1)}%
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
                    className={covenantInputClass}
                  />
                  <p className="text-xs text-zinc-500 pl-1">~{row.kas.toFixed(4)} KAS</p>
                </div>
                <div className="w-24 shrink-0">
                  <input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.1}
                    value={row.percent}
                    onChange={(e) => updateRow(row.key, { percent: e.target.value })}
                    className={`${covenantSmallInputClass} text-center`}
                    aria-label="Share percent"
                  />
                  <p className="text-[10px] text-center text-zinc-500 mt-1">%</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= 2}
                  className="mt-2.5 p-2 text-zinc-400 hover:text-red-500 disabled:opacity-30 rounded-lg border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
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
              className={KX_FORM_ADD_BTN_CLASS}
            >
              {covenantPremiumAddButtonLabel('split', rows.length)}
            </button>
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Memo (optional)"
              htmlFor="split-memo"
              tooltip="A note for everyone in the split, e.g. team payout or revenue share."
            />
            <input
              id="split-memo"
              type="text"
              maxLength={COVENANT_LAB_CONFIG.maxMemoLength}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. March team payout"
              className={covenantInputClass}
            />
          </div>
        </CovenantCreateShell>
      )}

      {tab === 'splits' && (
        <CovenantTabPanel
          title="Splits"
          heading="Your splits"
          description="Open and completed payment splits. Each recipient claims their share independently."
        >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="kx-body">
              {openCount} open, {splits.length} total
            </span>
            <button
              type="button"
              onClick={() => void refreshSplits()}
              className="text-xs text-[#02abb8] hover:underline"
            >
              Refresh
            </button>
          </div>
          {isLoading && splits.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">Loading...</p>
          ) : splits.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No splits yet. Create your first one.</p>
          ) : (
            splits.map((split) => (
              <div key={split.id} className={covenantCardClass}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded uppercase tracking-wide ${
                        split.status === 'open'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-green-500/20 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {split.status}
                    </span>
                    <p className="text-xs text-zinc-500 mt-2">From {shortKaspaAddr(split.depositor)}</p>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sompiToKas(split.totalSompi)} KAS
                  </span>
                </div>
                {split.memo ? (
                  <p className="text-zinc-600 dark:text-zinc-400">{split.memo}</p>
                ) : null}
                <ul className="space-y-3 border-t border-zinc-200 dark:border-zinc-700 pt-3">
                  {split.recipients.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
                          {shortKaspaAddr(r.address)}
                        </span>
                        <span className="text-zinc-500 ml-2">
                          {(r.shareBps / 100).toFixed(1)}% ({sompiToKas(r.amountSompi)} KAS)
                        </span>
                        {r.claimed ? (
                          <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                            claimed
                          </span>
                        ) : null}
                      </div>
                      {canClaimShare(split, r, kaspaState.address) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleClaim(split.id, r.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[#02abb8] text-[#02abb8] hover:bg-[#02abb8]/10 shrink-0"
                        >
                          Claim share
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
        </CovenantTabPanel>
      )}

      {tab === 'metadata' && (
        <CovenantTabPanel
          title="Metadata"
          heading="On-chain references"
          description="Covenant IDs, payload templates, and explorer links for your splits."
        >
        <KpxCovenantMetadataView
          template="split"
          runtimeMode={runtimeMode}
          effectiveMode={effectiveMode}
          instances={metadataInstances}
        />
        </CovenantTabPanel>
      )}
    </KpxCovenantShell>
  );
}
