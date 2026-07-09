'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
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
import { useKpxCovenantDeployFee } from '@/hooks/useKpxCovenantDeployFee';
import { crowdfundMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'browse' | 'create' | 'metadata';

export function CovenantCrowdfundWidget() {
  const { state } = useKaspaWallet();
  const { allCampaigns, loading, error, createCampaign, pledge, claimFunds, refund, refresh, runtimeMode, effectiveMode } =
    useCovenantCrowdfund();
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('crowdfund');
  const tab = useDAppWidgetSection('browse') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  useRegisterWidgetTabLabel('browse', `Campaigns (${allCampaigns.length})`, [allCampaigns.length]);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [goalKas, setGoalKas] = useState('5');
  const [deadline, setDeadline] = useState('');
  const [pledgeAmounts, setPledgeAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const metadataInstances = useMemo(() => crowdfundMetadataInstances(allCampaigns), [allCampaigns]);

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
      navigateTab('browse');
    } finally {
      setBusy(false);
    }
  };

  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? parseFloat(goalKas) || 0 : undefined,
    enabled: tab === 'create',
    primaryAction: (
      <button
        type="button"
        disabled={busy || !title || !deadline}
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? 'Launching...'
          : pricing.waived
            ? 'Launch campaign'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & launch`}
      </button>
    ),
    deps: [tab, busy, title, deadline, pricing, goalKas],
  });

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="crowdfund" />;
  }

  return (
    <KpxCovenantShell template="crowdfund" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <CovenantCreateShell template="crowdfund" heading="Launch campaign">
          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Campaign title"
              htmlFor="crowdfund-title"
              tooltip="A short name backers will see in the campaign list."
            />
            <input
              id="crowdfund-title"
              className={covenantInputClass}
              placeholder="e.g. Community art drop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label={`Funding goal (KAS, min ${minKas})`}
              htmlFor="crowdfund-goal"
              tooltip="The campaign succeeds only if this amount is pledged before the deadline."
            />
            <input
              id="crowdfund-goal"
              type="number"
              min={minKas}
              step="0.01"
              className={covenantInputClass}
              placeholder="Goal in KAS"
              value={goalKas}
              onChange={(e) => setGoalKas(e.target.value)}
            />
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Deadline"
              htmlFor="crowdfund-deadline"
              tooltip="After this date, no new pledges are accepted. The goal must be met by then for the creator to claim."
            />
            <input
              id="crowdfund-deadline"
              type="datetime-local"
              className={covenantInputClass}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Description (optional)"
              htmlFor="crowdfund-memo"
              tooltip="Tell backers what the raise is for."
            />
            <input
              id="crowdfund-memo"
              className={covenantInputClass}
              placeholder="What are you raising for?"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </CovenantCreateShell>
      )}

      {tab === 'browse' && (
        <CovenantTabPanel
          title="Campaigns"
          heading="Browse campaigns"
          description="Active and completed crowdfunds. Pledge KAS or claim refunds when rules allow."
        >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="kx-body">
              {allCampaigns.length} campaign{allCampaigns.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="text-xs text-[#02abb8] hover:underline"
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>
          {loading && !allCampaigns.length ? (
            <p className="text-center text-zinc-500 py-8">Loading...</p>
          ) : allCampaigns.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No campaigns yet. Launch the first one.</p>
          ) : (
            allCampaigns.map((c) => {
              const raised = sompiToKasNumber(c.raisedSompi);
              const goal = sompiToKasNumber(c.goalSompi);
              const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
              const isCreator =
                state.address && normalizeAddr(state.address) === normalizeAddr(c.creator);
              return (
                <div key={c.id} className={covenantCardClass}>
                  <div className="flex justify-between font-medium text-zinc-900 dark:text-zinc-100">
                    <span>{c.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">{c.status}</span>
                  </div>
                  {c.memo ? <p className="text-zinc-600 dark:text-zinc-400">{c.memo}</p> : null}
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#02abb8] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p>
                    {raised.toFixed(4)} / {goal} KAS ({pct.toFixed(0)}%)
                  </p>
                  <p className="text-xs text-zinc-500">
                    Creator {shortKaspaAddr(c.creator)} · ends {new Date(c.deadline).toLocaleString()}
                  </p>
                  {c.status === 'funding' && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="number"
                        min={minKas}
                        step="0.01"
                        className={covenantSmallInputClass}
                        placeholder="Pledge KAS"
                        value={pledgeAmounts[c.id] ?? ''}
                        onChange={(e) =>
                          setPledgeAmounts((p) => ({ ...p, [c.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="px-4 py-2 bg-[#02abb8] text-white rounded-lg text-sm font-medium hover:bg-[#028a94] shrink-0"
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
                      className={covenantSecondaryBtnClass}
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
                          className={`${covenantSecondaryBtnClass} mt-2 text-xs`}
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
        </CovenantTabPanel>
      )}

      {tab === 'metadata' && (
        <CovenantTabPanel
          title="Metadata"
          heading="On-chain references"
          description="Covenant IDs, payload templates, and explorer links for your campaigns."
        >
        <KpxCovenantMetadataView
          template="crowdfund"
          runtimeMode={runtimeMode}
          effectiveMode={effectiveMode}
          instances={metadataInstances}
        />
        </CovenantTabPanel>
      )}
    </KpxCovenantShell>
  );
}
