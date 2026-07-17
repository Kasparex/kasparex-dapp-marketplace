'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantMilestone } from '@/hooks/useCovenantMilestone';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import {
  defaultDeadlineAfterUnlock,
  resolveClaimWindowProgress,
} from '@/lib/covenant/claimWindow';
import { normalizeAddr } from '@/lib/covenant/utils';
import {
  CovenantFieldLabel,
  CovenantError,
  CovenantTabPanel,
  CovenantCreateShell,
  covenantInputClass,
  covenantCardClass,
  covenantSmallInputClass,
  covenantSecondaryBtnClass,
  shortKaspaAddr,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { KpxCovenantDisconnected, KpxCovenantShell } from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantMetadataView } from '@/components/dapps/covenant/KpxCovenantMetadataView';
import { useCovenantWidgetRail } from '@/hooks/useCovenantWidgetRail';
import { useKpxCovenantDeployFee, useKpxCovenantClaimFee } from '@/hooks/useKpxCovenantDeployFee';
import { covenantPremiumAddButtonLabel } from '@/lib/covenant/kpxCovenantPricing';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import { milestoneMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import { CovenantInstanceDetailModal } from '@/components/dapps/covenant/CovenantInstanceDetailModal';
import {
  CovenantDatetimeField,
  toDatetimeLocalValue,
} from '@/components/dapps/covenant/CovenantDatetimeField';
import { CovenantClaimWindowBar } from '@/components/dapps/covenant/CovenantClaimWindowBar';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'create' | 'deals' | 'metadata';
type BusyKey = null | 'create' | `claim:${string}:${string}` | `reclaim:${string}:${string}`;

type MilestoneRow = {
  key: string;
  label: string;
  pct: string;
  unlock: string;
  deadline: string;
};

function defaultUnlock(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16);
}

function newMilestoneRow(days: number, label: string, pct: string): MilestoneRow {
  const unlock = defaultUnlock(days);
  const unlockMs = new Date(unlock).getTime();
  return {
    key: `m_${Math.random().toString(36).slice(2, 9)}`,
    label,
    pct,
    unlock,
    deadline: toDatetimeLocalValue(defaultDeadlineAfterUnlock(unlockMs)),
  };
}

export function CovenantMilestoneWidget() {
  const { state } = useKaspaWallet();
  const {
    deals,
    loading,
    error,
    createDeal,
    claimStep,
    reclaimStep,
    refresh,
    runtimeMode,
    effectiveMode,
  } = useCovenantMilestone();
  const tab = useDAppWidgetSection('create') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  useRegisterWidgetTabLabel('deals', `Deals (${deals.length})`, [deals.length]);
  const [beneficiary, setBeneficiary] = useState('');
  const [totalKas, setTotalKas] = useState('1');
  const [memo, setMemo] = useState('');
  const [milestoneRows, setMilestoneRows] = useState<MilestoneRow[]>([
    newMilestoneRow(7, 'Deposit', '50'),
    newMilestoneRow(14, 'Delivery', '50'),
  ]);
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('milestone', milestoneRows.length);
  const { pricing: claimPricing } = useKpxCovenantClaimFee('milestone');
  const [busyKey, setBusyKey] = useState<BusyKey>(null);
  const [detailDealId, setDetailDealId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const metadataInstances = useMemo(() => milestoneMetadataInstances(deals), [deals]);
  const detailInstance = useMemo(
    () => metadataInstances.find((i) => i.id === detailDealId) ?? null,
    [metadataInstances, detailDealId],
  );
  const busy = busyKey != null;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const updateMilestoneRow = (key: string, patch: Partial<MilestoneRow>) => {
    setMilestoneRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const setUnlockAndSyncDeadline = (key: string, unlock: string) => {
    setMilestoneRows((prev) =>
      prev.map((row) => {
        if (row.key !== key) return row;
        const unlockMs = new Date(unlock).getTime();
        const deadlineMs = new Date(row.deadline).getTime();
        const nextDeadline =
          Number.isFinite(unlockMs) &&
          (!Number.isFinite(deadlineMs) || deadlineMs <= unlockMs)
            ? toDatetimeLocalValue(defaultDeadlineAfterUnlock(unlockMs))
            : row.deadline;
        return { ...row, unlock, deadline: nextDeadline };
      }),
    );
  };

  const addMilestoneRow = () => {
    if (milestoneRows.length >= 8) return;
    const nextIndex = milestoneRows.length + 1;
    setMilestoneRows((prev) => [...prev, newMilestoneRow(7 * nextIndex, `Milestone ${nextIndex}`, '')]);
  };

  const removeMilestoneRow = (key: string) => {
    if (milestoneRows.length <= 2) return;
    setMilestoneRows((prev) => prev.filter((row) => row.key !== key));
  };

  const handleCreate = async () => {
    setBusyKey('create');
    try {
      const milestones = milestoneRows.map((row) => {
        const unlockAt = new Date(row.unlock).getTime();
        const deadlineAt = new Date(row.deadline).getTime();
        if (!Number.isFinite(unlockAt)) {
          throw new Error(`Choose an unlock time for "${row.label || 'milestone'}"`);
        }
        if (!Number.isFinite(deadlineAt)) {
          throw new Error(`Choose a claim deadline for "${row.label || 'milestone'}"`);
        }
        if (deadlineAt <= unlockAt) {
          throw new Error(`Deadline must be after unlock for "${row.label || 'milestone'}"`);
        }
        return {
          label: row.label,
          shareBps: Math.round(parseFloat(row.pct) * 100),
          unlockAt,
          deadlineAt,
        };
      });
      await createDeal({
        beneficiary: beneficiary.trim(),
        totalKas: parseFloat(totalKas),
        memo,
        milestones,
      });
      navigateTab('deals');
    } finally {
      setBusyKey(null);
    }
  };

  const handleClaim = async (dealId: string, stepId: string) => {
    setBusyKey(`claim:${dealId}:${stepId}`);
    try {
      await claimStep(dealId, stepId);
    } finally {
      setBusyKey(null);
    }
  };

  const handleReclaim = async (dealId: string, stepId: string) => {
    setBusyKey(`reclaim:${dealId}:${stepId}`);
    try {
      await reclaimStep(dealId, stepId);
    } finally {
      setBusyKey(null);
    }
  };

  const claimOrReclaimBusy =
    typeof busyKey === 'string' &&
    (busyKey.startsWith('claim:') || busyKey.startsWith('reclaim:'));

  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? parseFloat(totalKas) || 0 : undefined,
    enabled: tab === 'create',
    flowAlwaysVisible: true,
    flowBusy: busy,
    flowPreset: tab === 'deals' || claimOrReclaimBusy ? 'covenantClaim' : 'covenantCreate',
    flowLockSignCount: milestoneRows.length,
    flowFeeWaived: tab === 'deals' || claimOrReclaimBusy ? claimPricing.waived : pricing.waived,
    primaryAction: (
      <button
        type="button"
        disabled={busy || !beneficiary.trim()}
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyKey === 'create'
          ? 'Creating deal...'
          : pricing.waived
            ? 'Fund milestone deal'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & fund deal`}
      </button>
    ),
    deps: [tab, busyKey, beneficiary, pricing, claimPricing, totalKas, milestoneRows.length, memo],
  });

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="milestone" />;
  }

  return (
    <KpxCovenantShell template="milestone" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <CovenantCreateShell template="milestone" heading="New milestone deal">
          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Who gets paid"
              htmlFor="milestone-beneficiary"
              tooltip="The Kaspa address that can claim each milestone during its claim window (after unlock, before deadline)."
            />
            <input
              id="milestone-beneficiary"
              className={covenantInputClass}
              placeholder="kaspa:..."
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
            />
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label={`Total amount (KAS, min ${minKas})`}
              htmlFor="milestone-total"
              tooltip="The full deal size. It is split across milestones below."
            />
            <input
              id="milestone-total"
              type="number"
              min={minKas}
              step="0.01"
              className={covenantInputClass}
              value={totalKas}
              onChange={(e) => setTotalKas(e.target.value)}
            />
          </div>

          <div className="k-form-group !mb-0 space-y-3">
            <CovenantFieldLabel
              label="Milestones"
              tooltip="Each row is one payment slice. Percentages should add up to 100. After unlock, the beneficiary has until the deadline to claim; otherwise you can reclaim."
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-1">
              Label · share % · unlock · claim deadline
            </p>
            {milestoneRows.map((row) => (
              <div key={row.key} className="space-y-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex gap-2 items-start">
                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <input
                      className={covenantSmallInputClass}
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => updateMilestoneRow(row.key, { label: e.target.value })}
                    />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      className={covenantSmallInputClass}
                      placeholder="%"
                      value={row.pct}
                      onChange={(e) => updateMilestoneRow(row.key, { pct: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMilestoneRow(row.key)}
                    disabled={milestoneRows.length <= 2}
                    className="mt-2.5 p-2 text-zinc-400 hover:text-red-500 disabled:opacity-30 rounded-lg border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                    aria-label="Remove milestone"
                  >
                    ×
                  </button>
                </div>
                <CovenantDatetimeField
                  id={`milestone-unlock-${row.key}`}
                  label="Unlock after"
                  tooltip="This milestone can be claimed after this date and time."
                  value={row.unlock}
                  onChange={(next) => setUnlockAndSyncDeadline(row.key, next)}
                  compact
                />
                <CovenantDatetimeField
                  id={`milestone-deadline-${row.key}`}
                  label="Claim deadline"
                  tooltip="If the beneficiary does not claim before this time, you (the creator) can reclaim this slice. Must be after unlock."
                  value={row.deadline}
                  onChange={(next) => updateMilestoneRow(row.key, { deadline: next })}
                  minNow={false}
                  compact
                />
                <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  Claim window: from unlock until the deadline. After the deadline, only you can reclaim.
                </p>
              </div>
            ))}
            <button
              type="button"
              onClick={addMilestoneRow}
              disabled={milestoneRows.length >= 8}
              className={KX_FORM_ADD_BTN_CLASS}
            >
              {covenantPremiumAddButtonLabel('milestone', milestoneRows.length)}
            </button>
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Memo (optional)"
              htmlFor="milestone-memo"
              tooltip="A short note stored with the deal, visible to both sides."
            />
            <input
              id="milestone-memo"
              className={covenantInputClass}
              placeholder="e.g. Website redesign, Phase 1"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </CovenantCreateShell>
      )}

      {tab === 'deals' && (
        <CovenantTabPanel
          title="Deals"
          heading="Your milestone deals"
          description="Funded deals and release status. Beneficiaries claim each slice in the unlock window; after the deadline, the creator can reclaim."
        >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="kx-body">
              {deals.length} deal{deals.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="text-xs text-[#02abb8] hover:underline"
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>
          {loading && !deals.length ? (
            <p className="text-zinc-500 text-center py-8">Loading...</p>
          ) : deals.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No deals yet. Create your first milestone payment.</p>
          ) : (
            deals.map((d) => (
              <div
                key={d.id}
                className={`${covenantCardClass} cursor-pointer transition hover:border-[#02abb8]/60`}
                role="button"
                tabIndex={0}
                onClick={() => setDetailDealId(d.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDetailDealId(d.id);
                  }
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">{d.status}</span>
                    <p className="text-[11px] text-[#02abb8] mt-1">Tap for details</p>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sompiToKasNumber(d.totalSompi)} KAS
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {shortKaspaAddr(d.depositor)} → {shortKaspaAddr(d.beneficiary)}
                </p>
                {d.milestones.map((s) => {
                  const closed = Boolean(s.claimed || s.reclaimed);
                  const canClaim =
                    Boolean(state.address) &&
                    normalizeAddr(state.address!) === normalizeAddr(d.beneficiary) &&
                    !closed &&
                    now >= s.unlockAt &&
                    (!s.deadlineAt || now < s.deadlineAt);
                  const canReclaim =
                    Boolean(state.address) &&
                    normalizeAddr(state.address!) === normalizeAddr(d.depositor) &&
                    !closed &&
                    s.deadlineAt != null &&
                    now >= s.deadlineAt;
                  const claiming = busyKey === `claim:${d.id}:${s.id}`;
                  const reclaiming = busyKey === `reclaim:${d.id}:${s.id}`;
                  const progress = resolveClaimWindowProgress({
                    now,
                    createdAt: d.createdAt,
                    unlockAt: s.unlockAt,
                    deadlineAt: s.deadlineAt,
                    done: closed,
                    doneLabel: s.reclaimed ? 'Reclaimed' : 'Claimed',
                  });
                  return (
                    <div
                      key={s.id}
                      className="space-y-2 border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-1"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 space-y-0.5 text-sm">
                          <p>
                            {s.label}: {sompiToKasNumber(s.amountSompi)} KAS
                            {s.reclaimed ? ' (reclaimed)' : s.claimed ? ' (claimed)' : ''}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Unlock: {new Date(s.unlockAt).toLocaleString()}
                          </p>
                          {s.deadlineAt ? (
                            <p className="text-xs text-zinc-500">
                              Deadline: {new Date(s.deadlineAt).toLocaleString()}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col gap-1.5">
                          {canClaim ? (
                            <button
                              type="button"
                              disabled={busy}
                              className={`text-xs px-3 py-1.5 rounded-lg ${covenantSecondaryBtnClass} w-auto disabled:opacity-50 disabled:cursor-wait`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleClaim(d.id, s.id);
                              }}
                            >
                              {claiming
                                ? 'Claiming...'
                                : claimPricing.waived
                                  ? 'Claim'
                                  : `Claim · ${claimPricing.feeKas.toFixed(2)} KAS`}
                            </button>
                          ) : null}
                          {canReclaim ? (
                            <button
                              type="button"
                              disabled={busy}
                              className={`text-xs px-3 py-1.5 rounded-lg ${covenantSecondaryBtnClass} w-auto disabled:opacity-50 disabled:cursor-wait`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleReclaim(d.id, s.id);
                              }}
                            >
                              {reclaiming
                                ? 'Reclaiming...'
                                : claimPricing.waived
                                  ? 'Reclaim'
                                  : `Reclaim · ${claimPricing.feeKas.toFixed(2)} KAS`}
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {progress ? <CovenantClaimWindowBar progress={progress} /> : null}
                    </div>
                  );
                })}
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
          description="Covenant IDs, payload templates, and explorer links for your deals."
        >
        <KpxCovenantMetadataView
          template="milestone"
          runtimeMode={runtimeMode}
          effectiveMode={effectiveMode}
          instances={metadataInstances}
        />
        </CovenantTabPanel>
      )}

      {detailInstance ? (
        <CovenantInstanceDetailModal
          instance={detailInstance}
          onClose={() => setDetailDealId(null)}
        />
      ) : null}
    </KpxCovenantShell>
  );
}
