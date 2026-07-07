'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantMilestone } from '@/hooks/useCovenantMilestone';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';
import {
  CovenantFieldLabel,
  CovenantError,
  CovenantHowItWorks,
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
import { useKpxCovenantDeployFee } from '@/hooks/useKpxCovenantDeployFee';
import { covenantPremiumAddButtonLabel } from '@/lib/covenant/kpxCovenantPricing';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import { milestoneMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'create' | 'deals' | 'metadata' | 'about';

type MilestoneRow = {
  key: string;
  label: string;
  pct: string;
  unlock: string;
};

function defaultUnlock(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16);
}

function newMilestoneRow(days: number, label: string, pct: string): MilestoneRow {
  return {
    key: `m_${Math.random().toString(36).slice(2, 9)}`,
    label,
    pct,
    unlock: defaultUnlock(days),
  };
}

export function CovenantMilestoneWidget() {
  const { state } = useKaspaWallet();
  const { deals, loading, error, createDeal, claimStep, refresh, runtimeMode, effectiveMode } =
    useCovenantMilestone();
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
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const metadataInstances = useMemo(() => milestoneMetadataInstances(deals), [deals]);

  const updateMilestoneRow = (key: string, patch: Partial<MilestoneRow>) => {
    setMilestoneRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
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
    setBusy(true);
    try {
      const milestones = milestoneRows.map((row) => ({
        label: row.label,
        shareBps: Math.round(parseFloat(row.pct) * 100),
        unlockAt: new Date(row.unlock).getTime(),
      }));
      await createDeal({
        beneficiary: beneficiary.trim(),
        totalKas: parseFloat(totalKas),
        memo,
        milestones,
      });
      navigateTab('deals');
    } finally {
      setBusy(false);
    }
  };

  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? parseFloat(totalKas) || 0 : undefined,
    enabled: tab === 'create',
    primaryAction: (
      <button
        type="button"
        disabled={busy || !beneficiary.trim()}
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? 'Creating...'
          : pricing.waived
            ? 'Fund milestone deal'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & fund deal`}
      </button>
    ),
    deps: [tab, busy, beneficiary, pricing, totalKas, milestoneRows.length],
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
              tooltip="The Kaspa address that can claim each milestone when its unlock date arrives."
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
              tooltip="Each row is one payment slice. Percentages should add up to 100. The beneficiary can claim after each unlock date."
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-1">
              Label · share % · unlock date
            </p>
            {milestoneRows.map((row) => (
              <div key={row.key} className="flex gap-2 items-start">
                <div className="grid flex-1 grid-cols-3 gap-2">
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
                  <input
                    type="datetime-local"
                    className={covenantSmallInputClass}
                    value={row.unlock}
                    onChange={(e) => updateMilestoneRow(row.key, { unlock: e.target.value })}
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
          description="Funded deals and milestone release status. Beneficiaries claim each slice on schedule."
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
              <div key={d.id} className={covenantCardClass}>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs uppercase tracking-wide text-zinc-500">{d.status}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sompiToKasNumber(d.totalSompi)} KAS
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {shortKaspaAddr(d.depositor)} → {shortKaspaAddr(d.beneficiary)}
                </p>
                {d.milestones.map((s) => {
                  const canClaim =
                    state.address &&
                    normalizeAddr(state.address) === normalizeAddr(d.beneficiary) &&
                    !s.claimed &&
                    Date.now() >= s.unlockAt;
                  return (
                    <div
                      key={s.id}
                      className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-1"
                    >
                      <span>
                        {s.label}: {sompiToKasNumber(s.amountSompi)} KAS
                        {s.claimed ? ' (claimed)' : ''}
                      </span>
                      {canClaim && (
                        <button
                          type="button"
                          className={`text-xs px-3 py-1.5 rounded-lg ${covenantSecondaryBtnClass} w-auto`}
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

      {tab === 'about' && (
        <CovenantTabPanel title="How it works" heading="How Milestone works">
        <CovenantHowItWorks>
          <p>
            Covenant Milestone helps you pay for work in stages without handing over the full amount on day one.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Fund once</strong>: you lock the total KAS for the whole deal.
            </li>
            <li>
              <strong>Release on schedule</strong>: each milestone unlocks on its date. Only the beneficiary can
              claim that slice.
            </li>
            <li>
              <strong>No middleman</strong>: rules are enforced by covenant logic on Kaspa L1 (simulated here until
              wallets ship covenant support).
            </li>
          </ul>
          <p className="text-xs text-zinc-500">
            Good for freelancers, builders, game quests, or any project with clear delivery steps.
          </p>
        </CovenantHowItWorks>
        </CovenantTabPanel>
      )}
    </KpxCovenantShell>
  );
}
