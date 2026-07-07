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
import { milestoneMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'create' | 'deals' | 'metadata' | 'about';

function defaultUnlock(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16);
}

export function CovenantMilestoneWidget() {
  const { state } = useKaspaWallet();
  const { deals, loading, error, createDeal, claimStep, refresh, runtimeMode, effectiveMode } =
    useCovenantMilestone();
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('milestone');
  const tab = useDAppWidgetSection('create') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  useRegisterWidgetTabLabel('deals', `Deals (${deals.length})`, [deals.length]);
  const [beneficiary, setBeneficiary] = useState('');
  const [totalKas, setTotalKas] = useState('1');
  const [memo, setMemo] = useState('');
  const [m1, setM1] = useState({ label: 'Deposit', pct: '40', unlock: defaultUnlock(7) });
  const [m2, setM2] = useState({ label: 'Delivery', pct: '40', unlock: defaultUnlock(14) });
  const [m3, setM3] = useState({ label: 'Final', pct: '20', unlock: defaultUnlock(21) });
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const metadataInstances = useMemo(() => milestoneMetadataInstances(deals), [deals]);

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
    deps: [tab, busy, beneficiary, pricing, totalKas],
  });

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="milestone" />;
  }

  return (
    <KpxCovenantShell template="milestone" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <div className="space-y-5">
          <div>
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

          <div>
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

          <div className="space-y-3">
            <CovenantFieldLabel
              label="Milestones"
              tooltip="Each row is one payment slice. Percentages should add up to 100. The beneficiary can claim after each unlock date."
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-1 mb-2">
              Label · share % · unlock date
            </p>
            {[m1, m2, m3].map((m, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input
                  className={covenantSmallInputClass}
                  placeholder="Label"
                  value={i === 0 ? m1.label : i === 1 ? m2.label : m3.label}
                  onChange={(e) =>
                    (i === 0 ? setM1 : i === 1 ? setM2 : setM3)({ ...m, label: e.target.value })
                  }
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  className={covenantSmallInputClass}
                  placeholder="%"
                  value={i === 0 ? m1.pct : i === 1 ? m2.pct : m3.pct}
                  onChange={(e) =>
                    (i === 0 ? setM1 : i === 1 ? setM2 : setM3)({ ...m, pct: e.target.value })
                  }
                />
                <input
                  type="datetime-local"
                  className={covenantSmallInputClass}
                  value={i === 0 ? m1.unlock : i === 1 ? m2.unlock : m3.unlock}
                  onChange={(e) =>
                    (i === 0 ? setM1 : i === 1 ? setM2 : setM3)({ ...m, unlock: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          <div>
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

        </div>
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
